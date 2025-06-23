    const codeInput = document.getElementById("codeInput");
    const outputArea = document.getElementById("outputArea");
    const errorArea = document.getElementById("errorArea");
    const languageSelect = document.getElementById("languageSelect");
    const symbolTable = document.querySelector("#symbolTable tbody");
    const parseTree = document.getElementById("parseTree");
    const stdinInput = document.getElementById("stdinInput");

    // OCR Image to Text
        document.getElementById("toggleMode").addEventListener("click", () => {
      document.body.classList.toggle("dark-mode");
    });
    
    document.getElementById("imageInput").addEventListener("change", async function () {
      const file = this.files[0];
      if (file) {
        const { data: { text } } = await Tesseract.recognize(file, 'eng');
        codeInput.value = text;
      }
    });

    // Compile Code using Piston API
    document.getElementById("compileBtn").addEventListener("click", async () => {
      outputArea.textContent = "Compiling...";
      errorArea.textContent = "";
      symbolTable.innerHTML = "";
      parseTree.textContent = "Generating parse tree...";

      const code = codeInput.value;
      const language = languageSelect.value;
      const stdin = stdinInput.value;

      const payload = {
        language: language,
        version: '*',
        stdin: stdin,
        files: [{ name: 'main', content: code }]
      };

      const res = await fetch("https://emkc.org/api/v2/piston/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const result = await res.json();
      outputArea.textContent = result.run.output || "";
      errorArea.textContent = result.run.stderr || "No errors.";

      // Simple symbol table extraction (variable declarations)
      const lines = code.split("\n");
      const regex = /\b(int|float|char|double|string|var)\s+([a-zA-Z_][a-zA-Z0-9_]*)/g;
      lines.forEach(line => {
        let match;
        while ((match = regex.exec(line)) !== null) {
          const type = match[1];
          const variable = match[2];
          const row = `<tr><td>${variable}</td><td>${type}</td></tr>`;
          symbolTable.innerHTML += row;
        }
      });

      // Simulated parse tree (static example)
      const treeDiagram = `graph TD\nStart-->Declaration\nDeclaration-->Assignment\nAssignment-->Output`;
      parseTree.textContent = treeDiagram;
      mermaid.init(undefined, parseTree);
    });

    // Export Output as PDF
    document.getElementById("exportPdfBtn").addEventListener("click", () => {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();

      const output = outputArea.textContent || "No output";
      const error = errorArea.textContent || "No errors";

      const combined = `Output:\n${output}\n\nErrors:\n${error}`;
      const lines = doc.splitTextToSize(combined, 180);

      doc.text(lines, 10, 10);
      doc.save("compiler_output.pdf");
    });