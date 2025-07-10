import * as vscode from 'vscode';
import { exec } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import * as chokidar from 'chokidar';

let fileWatcher: chokidar.FSWatcher | undefined;
let latexChecked = false;
let latexAvailable = false;

export function activate(context: vscode.ExtensionContext) {
    console.log('LaTeX Resume Builder is now active!');

    // Register commands
    const compileCommand = vscode.commands.registerCommand('resume-builder.compile', compileResume);
    const previewCommand = vscode.commands.registerCommand('resume-builder.quickPreview', quickPreview);
    const templateCommand = vscode.commands.registerCommand('resume-builder.insertTemplate', insertTemplate);
    const openPDFCommand = vscode.commands.registerCommand('resume-builder.openPDF', openPDF);

    // Add to subscriptions
    context.subscriptions.push(compileCommand, previewCommand, templateCommand, openPDFCommand);

    // Setup auto-compile watcher
    setupAutoCompile(context);

    // Setup configuration change listener
    vscode.workspace.onDidChangeConfiguration(e => {
        if (e.affectsConfiguration('resumeBuilder.autoCompile')) {
            setupAutoCompile(context);
        }
    });
}

async function compileResume() {
    const editor = vscode.window.activeTextEditor;
    if (!editor || !editor.document.fileName.endsWith('.tex')) {
        vscode.window.showErrorMessage('Please open a .tex file');
        return;
    }

    // Auto-save before compile
    if (editor.document.isDirty) {
        await editor.document.save();
    }

    const filePath = editor.document.fileName;
    const workingDir = path.dirname(filePath);
    const fileName = path.basename(filePath, '.tex');
    const config = vscode.workspace.getConfiguration('resumeBuilder');
    const compiler = config.get('compiler', 'pdflatex');

    await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: "Building Resume PDF...",
        cancellable: false
    }, async (progress) => {
        return new Promise<void>((resolve, reject) => {
            const command = `${compiler} -interaction=nonstopmode -halt-on-error "${path.basename(filePath)}"`;
            
            exec(command, { cwd: workingDir }, (error, stdout, stderr) => {
                if (error) {
                    // Parse LaTeX errors for better user experience
                    const errorMessage = parseLatexError(stderr || stdout || error.message);
                    vscode.window.showErrorMessage(`Resume compilation failed: ${errorMessage}`);
                    reject(error);
                } else {
                    vscode.window.showInformationMessage(`✅ Resume PDF created: ${fileName}.pdf`);
                    
                    // Auto-open PDF if configured
                    if (config.get('autoOpenPDF', true)) {
                        openPDFFile(path.join(workingDir, `${fileName}.pdf`));
                    }
                    
                    resolve();
                }
            });
        });
    });
}

async function quickPreview() {
    await compileResume();
    await openPDF();
}

async function openPDF() {
    const editor = vscode.window.activeTextEditor;
    if (!editor || !editor.document.fileName.endsWith('.tex')) {
        vscode.window.showErrorMessage('Please open a .tex file');
        return;
    }

    const filePath = editor.document.fileName;
    const workingDir = path.dirname(filePath);
    const fileName = path.basename(filePath, '.tex');
    const pdfPath = path.join(workingDir, `${fileName}.pdf`);

    if (fs.existsSync(pdfPath)) {
        openPDFFile(pdfPath);
    } else {
        vscode.window.showWarningMessage('PDF not found. Compile first!');
    }
}

function openPDFFile(pdfPath: string) {
    const platform = process.platform;
    let command: string;

    switch (platform) {
        case 'win32':
            command = `start "" "${pdfPath}"`;
            break;
        case 'darwin':
            command = `open "${pdfPath}"`;
            break;
        default:
            command = `xdg-open "${pdfPath}"`;
    }

    exec(command, (error) => {
        if (error) {
            vscode.window.showErrorMessage(`Failed to open PDF: ${error.message}`);
        }
    });
}

function insertTemplate() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        return;
    }

    const templates = {
        'Experience Section': `\\section{Experience}
\\resumeSubHeadingListStart
\\resumeSubheading
  {Job Title}{Date Range}
  {Company Name}{Location}
  \\resumeItemListStart
    \\resumeItem{Achievement or responsibility}
    \\resumeItem{Another achievement with quantified results}
  \\resumeItemListEnd
\\resumeSubHeadingListEnd`,

        'Education Section': `\\section{Education}
\\resumeSubHeadingListStart
\\resumeSubheading
  {Degree Name}{Graduation Date}
  {University Name}{Location}
  \\resumeItemListStart
    \\resumeItem{GPA: X.X/4.0}
    \\resumeItem{Relevant Coursework: Course1, Course2, Course3}
  \\resumeItemListEnd
\\resumeSubHeadingListEnd`,

        'Skills Section': `\\section{Technical Skills}
\\begin{itemize}[leftmargin=0.15in, label={}]
  \\small{\\item{
    \\textbf{Languages}{: Python, JavaScript, Java, C++} \\\\
    \\textbf{Frameworks}{: React, Node.js, Flask, Spring} \\\\
    \\textbf{Tools}{: Git, Docker, AWS, MySQL}
  }}
\\end{itemize}`,

        'Project Section': `\\section{Projects}
\\resumeSubHeadingListStart
\\resumeProjectHeading
  {\\textbf{Project Name} $|$ \\emph{Technologies Used}}{Date}
  \\resumeItemListStart
    \\resumeItem{Description of what the project does}
    \\resumeItem{Technical challenges overcome and results achieved}
  \\resumeItemListEnd
\\resumeSubHeadingListEnd`
    };

    vscode.window.showQuickPick(Object.keys(templates), {
        placeHolder: 'Select a resume section template'
    }).then(selection => {
        if (selection && templates[selection as keyof typeof templates]) {
            const template = templates[selection as keyof typeof templates];
            editor.insertSnippet(new vscode.SnippetString(template));
        }
    });
}

function setupAutoCompile(context: vscode.ExtensionContext) {
    const config = vscode.workspace.getConfiguration('resumeBuilder');
    const autoCompile = config.get('autoCompile', true);

    // Dispose existing watcher
    if (fileWatcher) {
        fileWatcher.close();
        fileWatcher = undefined;
    }

    if (autoCompile && vscode.workspace.workspaceFolders) {
        const workspacePath = vscode.workspace.workspaceFolders[0].uri.fsPath;
        
        fileWatcher = chokidar.watch('**/*.tex', {
            cwd: workspacePath,
            ignored: /node_modules/,
            ignoreInitial: true
        });

        let compileTimeout: NodeJS.Timeout;
        
        fileWatcher.on('change', (filePath) => {
            // Debounce compilation to avoid multiple rapid compilations
            clearTimeout(compileTimeout);
            compileTimeout = setTimeout(() => {
                const fullPath = path.join(workspacePath, filePath);
                if (vscode.window.activeTextEditor?.document.fileName === fullPath) {
                    compileResume();
                }
            }, 1000);
        });

        context.subscriptions.push({
            dispose: () => {
                if (fileWatcher) {
                    fileWatcher.close();
                }
            }
        });
    }
}

function parseLatexError(errorOutput: string): string {
    // Simple error parsing - can be enhanced
    const lines = errorOutput.split('\n');
    
    for (const line of lines) {
        if (line.includes('! ')) {
            return line.replace('! ', '');
        }
        if (line.includes('Error:')) {
            return line;
        }
    }
    
    return 'Unknown compilation error. Check the output for details.';
}

export function deactivate() {
    if (fileWatcher) {
        fileWatcher.close();
    }
}

// LaTeX Installation Checking Functions
async function checkLatexInstallation(): Promise<void> {
    if (latexChecked) return;
    
    const config = vscode.workspace.getConfiguration('resumeBuilder');
    const compiler = config.get('compiler', 'pdflatex');
    
    try {
        await checkCompilerAvailable(compiler);
        latexAvailable = true;
        console.log(`✅ ${compiler} is available`);
    } catch (error) {
        latexAvailable = false;
        console.log(`❌ ${compiler} is not available`);
        
        // Show welcome message with installation guide for new users
        const result = await vscode.window.showWarningMessage(
            `LaTeX compiler (${compiler}) not found. Install LaTeX to compile resumes.`,
            'Install Guide',
            'Dismiss'
        );
        
        if (result === 'Install Guide') {
            showInstallGuide();
        }
    }
    
    latexChecked = true;
}

function checkCompilerAvailable(compiler: string): Promise<void> {
    return new Promise((resolve, reject) => {
        exec(`${compiler} --version`, (error, stdout, stderr) => {
            if (error) {
                reject(error);
            } else {
                resolve();
            }
        });
    });
}

async function ensureLatexAvailable(): Promise<boolean> {
    if (!latexChecked) {
        await checkLatexInstallation();
    }
    
    if (!latexAvailable) {
        // Re-check in case user installed LaTeX since last check
        try {
            const config = vscode.workspace.getConfiguration('resumeBuilder');
            const compiler = config.get('compiler', 'pdflatex');
            await checkCompilerAvailable(compiler);
            latexAvailable = true;
            return true;
        } catch (error) {
            handleMissingLatex();
            return false;
        }
    }
    
    return true;
}

async function handleMissingLatex(): Promise<void> {
    const action = await vscode.window.showErrorMessage(
        'LaTeX compiler not found. Please install LaTeX to compile resumes.',
        'Install Guide',
        'Download LaTeX',
        'Check PATH'
    );
    
    switch (action) {
        case 'Install Guide':
            showInstallGuide();
            break;
        case 'Download LaTeX':
            openLatexDownloadPage();
            break;
        case 'Check PATH':
            showPathInstructions();
            break;
    }
}

function showInstallGuide(): void {
    const panel = vscode.window.createWebviewPanel(
        'latexInstallGuide',
        'LaTeX Installation Guide',
        vscode.ViewColumn.One,
        { enableScripts: false }
    );

    panel.webview.html = getInstallGuideHTML();
}

function getInstallGuideHTML(): string {
    const platform = process.platform;
    let platformInstructions = '';
    
    switch (platform) {
        case 'win32':
            platformInstructions = `
                <h3>🪟 Windows Installation</h3>
                <ol>
                    <li><strong>Download MiKTeX:</strong> Visit <a href="https://miktex.org/download">miktex.org/download</a></li>
                    <li><strong>Install:</strong> Run the installer with default settings</li>
                    <li><strong>Verify:</strong> Open Command Prompt and type: <code>pdflatex --version</code></li>
                    <li><strong>Restart VS Code</strong> after installation</li>
                </ol>
                
                <h4>Alternative: TeX Live</h4>
                <ul>
                    <li>Download from <a href="https://tug.org/texlive/windows.html">tug.org/texlive</a></li>
                    <li>Larger download but more complete</li>
                </ul>
            `;
            break;
            
        case 'darwin':
            platformInstructions = `
                <h3>🍎 macOS Installation</h3>
                <ol>
                    <li><strong>Download MacTeX:</strong> Visit <a href="https://tug.org/mactex/">tug.org/mactex</a></li>
                    <li><strong>Install:</strong> Run the .pkg installer (4GB download)</li>
                    <li><strong>Verify:</strong> Open Terminal and type: <code>pdflatex --version</code></li>
                    <li><strong>Restart VS Code</strong> after installation</li>
                </ol>
                
                <h4>Alternative: Homebrew</h4>
                <pre><code>brew install --cask mactex</code></pre>
                
                <h4>Lightweight Option: BasicTeX</h4>
                <pre><code>brew install --cask basictex</code></pre>
                <p><em>Note: BasicTeX may require additional packages for some resume templates</em></p>
            `;
            break;
            
        default: // Linux
            platformInstructions = `
                <h3>🐧 Linux Installation</h3>
                
                <h4>Ubuntu/Debian:</h4>
                <pre><code>sudo apt-get update
sudo apt-get install texlive-latex-base texlive-latex-extra</code></pre>
                
                <h4>Fedora/RHEL:</h4>
                <pre><code>sudo dnf install texlive-latex texlive-latex-extra</code></pre>
                
                <h4>Arch Linux:</h4>
                <pre><code>sudo pacman -S texlive-core texlive-latexextra</code></pre>
                
                <h4>Verify Installation:</h4>
                <pre><code>pdflatex --version</code></pre>
            `;
            break;
    }

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>LaTeX Installation Guide</title>
            <style>
                body { 
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    max-width: 800px;
                    margin: 0 auto;
                    padding: 20px;
                    line-height: 1.6;
                }
                h1 { color: #2563eb; }
                h3 { color: #1d4ed8; }
                code { 
                    background: #f3f4f6;
                    padding: 2px 6px;
                    border-radius: 4px;
                    font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
                }
                pre {
                    background: #f3f4f6;
                    padding: 12px;
                    border-radius: 8px;
                    overflow-x: auto;
                }
                .warning {
                    background: #fef3c7;
                    border-left: 4px solid #f59e0b;
                    padding: 12px;
                    margin: 16px 0;
                }
                .success {
                    background: #d1fae5;
                    border-left: 4px solid #10b981;
                    padding: 12px;
                    margin: 16px 0;
                }
            </style>
        </head>
        <body>
            <h1>📄 LaTeX Installation Guide</h1>
            <p>To use the LaTeX Resume Builder, you need a LaTeX distribution installed on your system.</p>
            
            ${platformInstructions}
            
            <div class="warning">
                <strong>⚠️ Important:</strong> After installation, restart VS Code to ensure the LaTeX compiler is recognized.
            </div>
            
            <h3>🧪 Test Your Installation</h3>
            <ol>
                <li>Create a new file called <code>test.tex</code></li>
                <li>Copy this content:</li>
            </ol>
            <pre><code>\\documentclass{article}
\\begin{document}
Hello, LaTeX!
\\end{document}</code></pre>
            <ol start="3">
                <li>Press <code>Ctrl+R</code> (or <code>Cmd+R</code>) to compile</li>
                <li>If successful, you'll see a PDF!</li>
            </ol>
            
            <div class="success">
                <strong>✅ Pro Tip:</strong> The extension works with any LaTeX document, not just resumes!
            </div>
            
            <h3>🆘 Need Help?</h3>
            <ul>
                <li><strong>PATH Issues:</strong> Make sure LaTeX binaries are in your system PATH</li>
                <li><strong>Permission Errors:</strong> Try running VS Code as administrator (Windows) or with sudo (Linux)</li>
                <li><strong>Package Missing:</strong> Install additional packages with your LaTeX distribution's package manager</li>
            </ul>
        </body>
        </html>
    `;
}

function openLatexDownloadPage(): void {
    const platform = process.platform;
    let downloadUrl = 'https://www.latex-project.org/get/';
    
    switch (platform) {
        case 'win32':
            downloadUrl = 'https://miktex.org/download';
            break;
        case 'darwin':
            downloadUrl = 'https://tug.org/mactex/';
            break;
        default:
            downloadUrl = 'https://tug.org/texlive/';
            break;
    }
    
    vscode.env.openExternal(vscode.Uri.parse(downloadUrl));
}

function showPathInstructions(): void {
    const platform = process.platform;
    let instructions = '';
    
    switch (platform) {
        case 'win32':
            instructions = `Windows PATH Instructions:
1. Search for "Environment Variables" in Start Menu
2. Click "Edit the system environment variables"
3. Click "Environment Variables" button
4. Find "Path" in System Variables, click "Edit"
5. Add LaTeX bin directory (usually C:\\Program Files\\MiKTeX\\miktex\\bin\\x64)
6. Restart VS Code`;
            break;
        case 'darwin':
            instructions = `macOS PATH Instructions:
1. Open Terminal
2. Edit your shell profile (~/.zshrc or ~/.bash_profile):
   echo 'export PATH="/usr/local/texlive/2023/bin/universal-darwin:$PATH"' >> ~/.zshrc
3. Reload: source ~/.zshrc
4. Restart VS Code`;
            break;
        default:
            instructions = `Linux PATH Instructions:
1. Check if LaTeX is installed: which pdflatex
2. If not in PATH, add to ~/.bashrc or ~/.zshrc:
   export PATH="/usr/local/texlive/2023/bin/x86_64-linux:$PATH"
3. Reload: source ~/.bashrc
4. Restart VS Code`;
            break;
    }
    
    vscode.window.showInformationMessage(instructions, { modal: true });
}