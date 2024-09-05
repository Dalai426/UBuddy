/* eslint-disable @typescript-eslint/no-var-requires */
const ts = require('typescript');
const fs = require('fs');

function extractMethodsToClient(filePath, outputFilePath) {
  const program = ts.createProgram([filePath], {
    allowJs: true,
    target: ts.ScriptTarget.ES2017,
    module: ts.ModuleKind.CommonJS,
  });
  const sourceFile = program.getSourceFile(filePath);
  const checker = program.getTypeChecker();
  const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });

  if (!sourceFile) {
    console.error(`Source file not found: ${filePath}`);
    return;
  }

  const clientMembers = [];

  function visitNode(node) {
    if (ts.isClassDeclaration(node) && node.name) {
      const className = node.name.text;
      const clientName = `${className}Client`;

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

            // Log modifiers
            if (method.modifiers) {
              method.modifiers.forEach((modifier) => {
                console.log(modifier.getText(sourceFile));
              });
            }
            const methodSignature = ts.factory.createMethodDeclaration(
              method.modifiers,
              undefined,
              methodName,
              undefined,
              undefined,
              method.parameters,
              method.type,
              ts.factory.createBlock(
                [
                  ts.factory.createThrowStatement(
                    ts.factory.createNewExpression(
                      ts.factory.createIdentifier('Error'),
                      undefined,
                      [
                        ts.factory.createStringLiteral(
                          'Method not implemented',
                        ),
                      ],
                    ),
                  ),
                ],
                true,
              ),
            );

            clientMembers.push(methodSignature);
          }
        });

        // Create the class declaration
        const classDeclaration = ts.factory.createClassDeclaration(
          [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
          clientName,
          undefined,
          undefined,
          clientMembers,
        );

        // Print the class declaration
        const result = printer.printNode(
          ts.EmitHint.Unspecified,
          classDeclaration,
          sourceFile,
        );

        // Write to output file
        fs.writeFileSync(outputFilePath, result, 'utf8');
        console.log(`Class has been written to ${outputFilePath}`);
      }
    } else {
      ts.forEachChild(node, visitNode);
    }
  }

  visitNode(sourceFile);
}

// Usage example
const inputFilePath = './src/event/event.controller.ts'; // Replace with the path to your file
const outputFilePath = './src/event.controller.client.ts'; // Replace with the desired output path

extractMethodsToClient(inputFilePath, outputFilePath);
