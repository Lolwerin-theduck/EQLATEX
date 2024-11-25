const input = document.getElementById("latex-input");
const preview = document.getElementById("preview");

// Define constant custom commands
const customCommands = {
    "pi": "\\pi",
    "->": "\\to",
    "<-": "\\gets",
    "<->": "\\leftrightarrow",
    "<==": "\\impliedby",
    "==>": "\\implies",
    "<=>": "\\iff",
    "<=": "\\leq",
    ">=": "\\geq",
    "inf": "\\infty",
    "deg": "\\degree",
    "degC": "\\degreeCelsius"
};

// Parse constant syntax replacements
function parseConstSyntax(inputText) {
    let parsedText = inputText;
    for (const [shorthand, latex] of Object.entries(customCommands)) {
        parsedText = parsedText.replace(shorthand, latex);
    }
    return parsedText;
}

// Replace "sqrt(x)" with "\sqrt{x}"
function parseSquareRoots(inputText) {
    return inputText.replace(/sqrt\((.+?)\)/g, (_, content) => `\\sqrt{${content}}`);
}

// Convert functions like ln(x), sin(x), etc.
function parseFunctions(inputText) {
    return inputText.replace(/\b(ln|sin|cos|tan)\((.+?)\)/g, (_, func, content) => `\\${func}{${content}}`);
}

// Convert log(x, y) to \log_x{y} and log(x) to \log{x}
function parseLogarithms(inputText) {
    return inputText.replace(/log\(([^,]+)(?:,([^,]+))?\)/g, (_, base, content) => {
        if (!content) return `\\log{${base}}`;
        if (base === "10") return `\\log{${content}}`;
        if (base === "e") return `\\ln{${content}}`;
        return `\\log_${base}{${content}}`;
    });
}

// Parse exponents with proper grouping and chaining support
function parseExponents(inputText) {
    const exponentRegex = /([a-zA-Z0-9.()]+)\^([a-zA-Z0-9.()]+(\^.*)?)/g;

    // Recursive parsing for exponents
    function recursiveParseExponent(input) {
        return input.replace(exponentRegex, (_, base, exp) => {
            const parsedExp = recursiveParseExponent(exp); // Parse deeper exponents
            const cleanBase = /^\(.+\)$/.test(base) ? base.slice(1, -1) : base; // Remove unnecessary parentheses
            return `${cleanBase}^{${parsedExp}}`;
        });
    }

    return recursiveParseExponent(inputText);
}


// Parse fractions with nesting support and remove unnecessary parentheses
function parseFractions(inputText) {
    const fractionRegex = /(\([^()]+\)|-?[a-zA-Z0-9.]+)\/(\([^()]+\)|-?[a-zA-Z0-9.]+)/g;
    

    function recursiveParse(text) {
        return text.replace(fractionRegex, (_, numerator, denominator) => {
            const parsedNumerator = fractionRegex.test(numerator) ? recursiveParse(numerator) : numerator;
            const parsedDenominator = fractionRegex.test(denominator) ? recursiveParse(denominator) : denominator;

            const cleanNumerator = /^\(.+\)$/.test(parsedNumerator) ? parsedNumerator.slice(1, -1) : parsedNumerator;
            const cleanDenominator = /^\(.+\)$/.test(parsedDenominator) ? parsedDenominator.slice(1, -1) : parsedDenominator;

            return `\\frac{${cleanNumerator}}{${cleanDenominator}}`;
        });
    }

    return recursiveParse(inputText);
}

function parseText(inputText) {
    // Regular expression to detect text(...) blocks
    const textRegex = /"(.*?)"/g;

    // Escape LaTeX special characters
    function escapeLaTeX(text) {
        const specialChars = /([#\$%&_\{\}\~\^\\])/g;
        return text.replace(specialChars, '\\$1');
    }

    // Replace text(...) with \text{...}
    return inputText.replace(textRegex, (_, content) => `\\text{${escapeLaTeX(content)}}`);
}


// Parse dynamic custom commands
function parseDynamicSyntax(inputText) {
    let parsedText = inputText;
    //parsedText = parsedText.replace(/\n/g, " \\newLine ");
    parsedText = parseText(parsedText);
    parsedText = parseSquareRoots(parsedText);
    parsedText = parseFunctions(parsedText);
    parsedText = parseLogarithms(parsedText);
    parsedText = parseExponents(parsedText);
    parsedText = parseFractions(parsedText);

    return parsedText;
}

function copy() {
    navigator.clipboard.writeText(parseDynamicSyntax(parseConstSyntax(input.value)));
}

function debugs(exp = input.value) {
    console.log(parseExponents(parseConstSyntax(exp)));
}

// Update preview on input change
input.addEventListener("input", (event) => {
    const target = event.target;

    // Get the caret position
    const caretPos = target.selectionStart;
    const value = target.value;

    // Check if the inserted character is "("
    if (event.data === "(") {
        // Insert ")" after "("
        const newValue = value.slice(0, caretPos) + ")" + value.slice(caretPos);
        target.value = newValue;

        // Move the caret back between the parentheses
        target.setSelectionRange(caretPos, caretPos);
    }else if (event.data === '"') {
        // Insert " after "
        const newValue = value.slice(0, caretPos) + '"' + value.slice(caretPos);
        target.value = newValue;

        // Move the caret back between the parentheses
        target.setSelectionRange(caretPos, caretPos);
    }

    // Update preview with parsed LaTeX
    try {
        const parsedInput = parseDynamicSyntax(parseConstSyntax(target.value));
        preview.innerHTML = `$$${parsedInput}$$`;
        MathJax.typesetPromise([preview]);
    } catch (error) {
        preview.innerHTML = "Error in parsing input. Please check your syntax.";
    }
});
