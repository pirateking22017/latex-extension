# LaTeX Resume Builder

A VS Code extension specifically designed for building LaTeX resumes with one-click compilation and preview.

## Features

- **One-click compilation**: Build your resume PDF with `Ctrl+R` (or `Cmd+R` on Mac)
- **Auto-compilation**: Automatically compiles when you save changes
- **Quick preview**: Compile and open PDF with `Ctrl+Shift+R`
- **Resume templates**: Insert common resume sections (Experience, Education, Skills, Projects)
- **Auto-open PDF**: Automatically opens the generated PDF after compilation
- **Error parsing**: Clear error messages when compilation fails

## Requirements

- LaTeX distribution installed (TeX Live, MiKTeX, or MacTeX)
- `pdflatex`, `xelatex`, or `lualatex` available in PATH

## Usage

1. Open a `.tex` file
2. Press `Ctrl+R` to compile to PDF
3. Right-click in editor for more options
4. Use Command Palette: "Build Resume PDF"

## Commands

- `Resume Builder: Build Resume PDF` - Compile current .tex file to PDF
- `Resume Builder: Quick Preview Resume` - Compile and open PDF
- `Resume Builder: Insert Resume Section Template` - Insert common resume sections
- `Resume Builder: Open Resume PDF` - Open the generated PDF

## Settings

- `resumeBuilder.autoCompile`: Auto-compile when file changes (default: true)
- `resumeBuilder.autoOpenPDF`: Auto-open PDF after compilation (default: true)
- `resumeBuilder.compiler`: LaTeX compiler to use (default: pdflatex)

## Development

To work on this extension:

1. Install dependencies: `npm install`
2. Compile: `npm run compile`
3. Watch for changes: `npm run watch`
4. Package for publishing: `npm run package`

## Building

```bash
npm install
npm run compile
```

For development with watch mode:
```bash
npm run watch
```

## License

MIT