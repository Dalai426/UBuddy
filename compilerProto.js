/* eslint-disable @typescript-eslint/no-var-requires */
const ts = require('typescript');
const fs = require('fs');

function extractMethodsToInterface(filePath, outputFilePath) {
  const program = ts.createProgram([filePath], {
    allowJs: true,
    target: ts.ScriptTarget.ES2017,
  });
  const sourceFile = program.getSourceFile(filePath);
  const checker = program.getTypeChecker();
  const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });

  if (!sourceFile) {
    console.error(`Source file not found: ${filePath}`);
    return;
  }

  const interfaceMembers = [];

  ts.forEachChild(sourceFile, (node) => {
    if (ts.isClassDeclaration(node) && node.name) {
      const className = node.name.text;
      const interfaceName = `${className}Interface`;

      const symbol = checker.getSymbolAtLocation(node.name);
      if (symbol) {
        const members = symbol.members;
        members.forEach((memberSymbol) => {
          if (
            memberSymbol.valueDeclaration &&
            ts.isMethodDeclaration(memberSymbol.valueDeclaration)
          ) {
            const method = memberSymbol.valueDeclaration;
            const methodName = method.name.getText(sourceFile);

            // Parameters
            const parameters = method.parameters.map((param) => {
              return ts.factory.createParameterDeclaration(
                undefined,
                undefined,
                param.name.getText(sourceFile),
                undefined,
                getParameterType(param, program.getTypeChecker()),
                undefined,
              );
            });

            const isAsync = method.modifiers?.some(
              (modifier) =>
                ts.isModifier(modifier) &&
                modifier.kind === ts.SyntaxKind.AsyncKeyword,
            );
            const methodType =
              method.type ??
              ts.factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword);

            let returnType = methodType;

            if (!method.type) {
              returnType = isAsync
                ? ts.factory.createTypeReferenceNode('Promise', [methodType])
                : methodType;
            }

            const methodSignature = ts.factory.createMethodSignature(
              undefined, // modifiers: readonly ts.Modifier[] | undefined
              methodName, // name: string | ts.PropertyName
              undefined, // questionToken: ts.QuestionToken | undefined
              undefined, // typeParameters: readonly ts.TypeParameterDeclaration[] | undefined
              parameters, // parameters: readonly ts.ParameterDeclaration[]
              getParameterType(returnType, program.getTypeChecker()),
            );

            interfaceMembers.push(methodSignature);
          }
        });

        // Create the interface declaration
        const interfaceDeclaration = ts.factory.createInterfaceDeclaration(
          [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
          interfaceName,
          undefined,
          undefined,
          interfaceMembers,
        );

        // Print the interface declaration
        const result = printer.printNode(
          ts.EmitHint.Unspecified,
          interfaceDeclaration,
          sourceFile,
        );

        // Write to output file
        fs.writeFileSync(outputFilePath, result, 'utf8');
        console.log(`Interface has been written to ${outputFilePath}`);
      }
    }
  });
}

// Function to handle parameter types
function getParameterType(param, checker) {
  const type = checker.getTypeAtLocation(param);
  if (type.isUnionOrIntersection()) {
    // Handle union or intersection types
    return ts.factory.createUnionTypeNode(
      type.isUnion() ? ts.SyntaxKind.UnionType : ts.SyntaxKind.IntersectionType,
      type.types.map((subType) =>
        getParameterType(subType.symbol.declarations[0], checker),
      ),
    );
  } else if (type.symbol && type.symbol.name === 'Promise') {
  } else if (checker.isArrayType(type)) {
    // Handle array types
    const elementType = checker.getElementTypeOfArrayType(type);
    return ts.factory.createArrayTypeNode(
      getParameterType(elementType.symbol.declarations[0], checker),
    );
  } else if (type.isClassOrInterface()) {
    // Handle object or class types
    const properties = checker.getPropertiesOfType(type);
    return ts.factory.createTypeLiteralNode(
      properties.map((property) => {
        const propertyType = getParameterType(
          property.valueDeclaration,
          checker,
        );
        const optional = property.flags & ts.SymbolFlags.Optional;

        return ts.factory.createPropertySignature(
          undefined,
          property.name,
          optional
            ? ts.factory.createToken(ts.SyntaxKind.QuestionToken)
            : undefined,
          propertyType,
        );
      }),
    );
  } else if (type.isUnion()) {
    // Handle optional types
    if (type.types.some((t) => t.flags & ts.TypeFlags.Undefined)) {
      const nonUndefinedTypes = type.types.filter(
        (t) => !(t.flags & ts.TypeFlags.Undefined),
      );
      if (nonUndefinedTypes.length === 1) {
        return ts.factory.createUnionTypeNode([
          getParameterType(nonUndefinedTypes[0], checker),
          ts.factory.createKeywordTypeNode(ts.SyntaxKind.UndefinedKeyword),
        ]);
      }
    }
  } else {
    // Handle basic types
    return checker.typeToTypeNode(type, undefined, undefined);
  }
}

// Usage example
const inputFilePath = './src/event/event.controller.ts'; // Replace with the path to your file
const outputFilePath = './src/event.controller.interface.ts'; // Replace with the desired output path

extractMethodsToInterface(inputFilePath, outputFilePath);
