# LaTeX Resume Builder

A VS Code extension specifically designed for building LaTeX resumes with one-click compilation and preview.

## ✨ Features

- **One-click compilation**: Build your resume PDF with `Ctrl+R` (or `Cmd+R` on Mac)
- **Auto-compilation**: Automatically compiles when you save changes
- **Quick preview**: Compile and open PDF with `Ctrl+Shift+R`
- **Resume templates**: Insert common resume sections (Experience, Education, Skills, Projects)
- **Auto-open PDF**: Automatically opens the generated PDF after compilation
- **Smart error handling**: Clear error messages and installation guidance
- **Multi-compiler support**: Works with pdflatex, xelatex, and lualatex

## 📋 Prerequisites

**You need a LaTeX distribution installed on your system.** The extension will guide you through installation if LaTeX is not found.

### 🪟 Windows

**Option 1: MiKTeX (Recommended)**
1. Download from [miktex.org/download](https://miktex.org/download)
2. Run the installer with default settings
3. Restart VS Code after installation

**Option 2: TeX Live**
1. Download from [tug.org/texlive/windows.html](https://tug.org/texlive/windows.html)
2. Larger download (~4GB) but more complete

**Verify Installation:**
```cmd
pdflatex --version
```

### 🍎 macOS

**Option 1: MacTeX (Full Distribution)**
1. Download from [tug.org/mactex](https://tug.org/mactex/)
2. Install the .pkg file (~4GB download)
3. Restart VS Code after installation

**Option 2: Homebrew**
```bash
# Full installation
brew install --cask mactex

# Or lightweight version
brew install --cask basictex
```

**Verify Installation:**
```bash
pdflatex --version
```

### 🐧 Linux

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install texlive-latex-base texlive-latex-extra
```

**Fedora/RHEL:**
```bash
sudo dnf install texlive-latex texlive-latex-extra
```

**Arch Linux:**
```bash
sudo pacman -S texlive-core texlive-latexextra
```

**Verify Installation:**
```bash
pdflatex --version
```

## 🚀 Quick Start

1. **Install the extension** from VS Code Marketplace
2. **Install LaTeX** (see prerequisites above)
3. **Create a test file** called `resume.tex`:

```latex
\documentclass[letterpaper,11pt]{article}
\usepackage[margin=1in]{geometry}

\begin{document}

\begin{center}
{\Large \textbf{Your Name}} \\
\vspace{2pt}
Email: your.email@example.com | Phone: (555) 123-4567
\end{center}

\section*{Experience}
\textbf{Software Engineer} \hfill \textit{2022 - Present} \\
Tech Company, San Francisco, CA
\begin{itemize}
\item Developed web applications using React and Node.js
\item Improved system performance by 30\%
\end{itemize}

\end{document}
```

4. **Press `Ctrl+R`** (or `Cmd+R` on Mac) to compile
5. **Your PDF opens automatically!**

## 📖 Usage

### Keyboard Shortcuts
- `Ctrl+R` / `Cmd+R` - Build Resume PDF
- `Ctrl+Shift+R` / `Cmd+Shift+R` - Quick Preview (compile + open)

### Commands (Ctrl+Shift+P)
- `Resume Builder: Build Resume PDF` - Compile current .tex file to PDF
- `Resume Builder: Quick Preview Resume` - Compile and open PDF
- `Resume Builder: Insert Resume Section Template` - Insert common resume sections
- `Resume Builder: Open Resume PDF` - Open existing PDF
- `Resume Builder: LaTeX Installation Guide` - Help with LaTeX setup

### Context Menu
Right-click in any `.tex` file for quick access to compilation and template insertion.

## 🔧 Settings

Open VS Code settings and search for "Resume Builder":

- `resumeBuilder.autoCompile`: Auto-compile when file changes (default: `true`)
- `resumeBuilder.autoOpenPDF`: Auto-open PDF after compilation (default: `true`)
- `resumeBuilder.compiler`: LaTeX compiler to use (default: `pdflatex`)
  - Options: `pdflatex`, `xelatex`, `lualatex`

## 🎯 Resume Templates

The extension includes built-in templates for common resume sections:

- **Experience Section** - Job positions with achievements
- **Education Section** - Degrees and coursework
- **Skills Section** - Technical skills categorized
- **Projects Section** - Personal/professional projects

Access via `Ctrl+Shift+P` → "Insert Resume Section Template"

## 🔥 Popular Resume Classes

Works great with popular LaTeX resume classes:

```latex
% Modern CV
\documentclass{moderncv}

% Awesome CV
\documentclass{awesome-cv}

% Simple Article
\documentclass{article}
```

## 🛠️ Troubleshooting

### "LaTeX compiler not found"
1. Ensure LaTeX is installed (see Prerequisites above)
2. Restart VS Code after LaTeX installation
3. Check that LaTeX is in your system PATH
4. Use `Resume Builder: LaTeX Installation Guide` command for help

### "Permission denied" errors
- **Windows**: Try running VS Code as Administrator
- **Linux/Mac**: Check file permissions in your project folder

### Missing packages
Your LaTeX distribution should include most packages. If you get package errors:
- **MiKTeX**: Packages install automatically on first use
- **TeX Live**: Use `tlmgr install package-name`

### Path issues
If LaTeX is installed but not found:
- **Windows**: Add LaTeX to System PATH in Environment Variables
- **Mac/Linux**: Add LaTeX bin directory to your shell's PATH

## 🎨 Example Resume Templates

Check out these popular LaTeX resume templates that work great with this extension:

- [Awesome CV](https://github.com/posquit0/Awesome-CV)
- [ModernCV](https://ctan.org/pkg/moderncv)
- [AltaCV](https://github.com/liantze/AltaCV)
- [Twenty Seconds CV](https://github.com/spagnuolocarmine/TwentySecondsCurriculumVitae-LaTex)

## 🤝 Contributing

Found a bug or want to contribute? Check out the [GitHub repository](https://github.com/your-username/latex-resume-builder).

## 📄 License

MIT License - feel free to use and modify!
