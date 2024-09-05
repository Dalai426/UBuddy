import * as ts from 'typescript';

function extractFunctionMetadata(fileName: string, code: string) {
    const sourceFile = ts.createSourceFile(fileName, code, ts.ScriptTarget.Latest, true);

    function visit(node: ts.Node) {
        if (ts.isFunctionDeclaration(node) || ts.isMethodDeclaration(node)) {
            // Function/Method Name
            const name = node.name?.getText(sourceFile);

            // Return Type
            const returnType = node.type?.getText(sourceFile);

            // Parameters
            const parameters = node.parameters.map(param => {
                return {
                    name: param.name.getText(sourceFile),
                    type: param.type?.getText(sourceFile),
                };
            });

            // Decorators
            const decorators = node.decorators?.map(decorator => {
                return decorator.getText(sourceFile);
            }) || [];

            console.log({
                name,
                returnType,
                parameters,
                decorators,
            });
        }

        ts.forEachChild(node, visit);
    }

    visit(sourceFile);
}

// Example usage
const code = `
class Example {
    @SomeDecorator
    method(param1: string, param2: number): boolean {
        return true;
    }
}
`;

extractFunctionMetadata('example.ts', code);