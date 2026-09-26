const PDFDocument = require("pdfkit");

class CertificateService {
  /**
   * Gera um documento PDF oficial de Certidão Notarial de Registro em Blockchain.
   * @param {Object} docData Dados do documento recuperados da Blockchain
   * @param {stream.Writable} res Stream de resposta HTTP para download
   */
  generateCertificate(docData, res) {
    const doc = new PDFDocument({
      size: "A4",
      margin: 45,
      info: {
        Title: `Certidao_Notarial_${docData.title}.pdf`,
        Author: "Cartório Notarial Distribuído - Rede Ethereum Local",
        Subject: "Certidão de Registro e Autenticidade em Blockchain",
        Keywords: "Blockchain, Ethereum, Ganache, DApp, Notario, Certidao, Hash",
      },
    });

    doc.pipe(res);

    // Paleta de Cores
    const primaryColor = "#0f172a";   // Slate 900
    const accentColor = "#0284c7";    // Sky 600
    const greenColor = "#059669";     // Emerald 600
    const redColor = "#dc2626";       // Red 600
    const grayColor = "#475569";      // Slate 600
    const lightBg = "#f8fafc";        // Slate 50

    // Borda Externa Notarial Elegante
    doc.rect(25, 25, 545, 792).lineWidth(1.5).stroke(accentColor);
    doc.rect(29, 29, 537, 784).lineWidth(0.5).stroke("#cbd5e1");

    // Cabeçalho Notarial
    doc.moveDown(0.5);
    doc
      .fontSize(10)
      .fillColor(grayColor)
      .text("REPÚBLICA FEDERATIVA DO BRASIL", { align: "center", characterSpacing: 2 })
      .moveDown(0.2);

    doc
      .fontSize(18)
      .fillColor(primaryColor)
      .font("Helvetica-Bold")
      .text("CARTÓRIO NOTARIAL DISTRIBUÍDO", { align: "center", characterSpacing: 1 })
      .moveDown(0.2);

    doc
      .fontSize(11)
      .fillColor(accentColor)
      .font("Helvetica")
      .text("SISTEMA DESCENTRALIZADO DE REGISTRO E AUTENTICAÇÃO EM BLOCKCHAIN", { align: "center" })
      .moveDown(1);

    // Linha divisória
    doc.strokeColor("#e2e8f0").lineWidth(1).moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(1);

    // Título da Certidão
    doc
      .fontSize(15)
      .fillColor(primaryColor)
      .font("Helvetica-Bold")
      .text("CERTIDÃO DE FÉ PÚBLICA DIGITAL & REGISTRO IMUTÁVEL", { align: "center" })
      .moveDown(1);

    // Texto de Abertura
    doc
      .fontSize(10)
      .font("Helvetica")
      .fillColor(grayColor)
      .text(
        "Certifico e dou fé que o documento digital especificado abaixo foi devidamente submetido, validado e registrado de forma perpétua e imutável na infraestrutura Blockchain (Ethereum Virtual Machine). Os dados encontram-se criptograficamente selados no Smart Contract notarial, gozando de anterioridade e autenticidade temporal comprovada.",
        { align: "justify", lineGap: 4 }
      )
      .moveDown(1.5);

    // Caixa de Informações do Documento
    const startY = doc.y;
    doc.roundedRect(45, startY, 505, 230, 8).fillAndStroke(lightBg, "#e2e8f0");

    doc.fillColor(primaryColor).font("Helvetica-Bold").fontSize(11);
    let textY = startY + 15;

    const printField = (label, value, isMonospace = false, valueColor = primaryColor) => {
      doc.font("Helvetica-Bold").fontSize(9.5).fillColor(grayColor).text(label, 60, textY);
      doc.font(isMonospace ? "Courier" : "Helvetica").fontSize(9.5).fillColor(valueColor).text(value, 200, textY, { width: 335 });
      textY += 24;
    };

    printField("Título do Documento:", docData.title || "Não especificado");
    printField("Categoria / Tipo:", docData.documentType || "Geral");
    printField("Data & Hora do Registro:", docData.registeredDate || "N/A");
    printField("Titular / Registrante:", docData.owner || "N/A", true);
    printField("Hash Criptográfico (SHA-256):", docData.hash || "N/A", true, accentColor);
    printField(
      "Situação Notarial:",
      docData.isValid ? "VÁLIDO / ATIVO (Comprovado)" : "REVOGADO",
      false,
      docData.isValid ? greenColor : redColor
    );

    if (!docData.isValid && docData.revocationReason) {
      printField("Motivo da Revogação:", docData.revocationReason, false, redColor);
      printField("Data da Revogação:", docData.revokedDate || "N/A");
    }

    doc.y = startY + 250;

    // Selo de Garantia Criptográfica
    doc
      .fontSize(11)
      .font("Helvetica-Bold")
      .fillColor(primaryColor)
      .text("CLÁUSULA DE VERIFICAÇÃO E AUDITORIA", { underline: true })
      .moveDown(0.4);

    doc
      .fontSize(9)
      .font("Helvetica")
      .fillColor(grayColor)
      .text(
        "A integridade desta certidão pode ser auditada a qualquer tempo por qualquer cidadão ou órgão regulador. Basta calcular a função hash SHA-256 do arquivo original e submetê-la à função de verificação pública do contrato inteligente, ou acessar o portal do Cartório Distribuído. A equivalência exata dos 64 caracteres hexadecimais atesta matematicamente a ausência de adulteração.",
        { align: "justify", lineGap: 3 }
      )
      .moveDown(1.5);

    // Rodapé Notarial com Carimbo Temporal
    doc.strokeColor("#e2e8f0").lineWidth(1).moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(1);

    doc
      .fontSize(8)
      .font("Helvetica-Oblique")
      .fillColor(grayColor)
      .text(
        `Emitido digitalmente pelo Cartório Distribuído em ${new Date().toLocaleString("pt-BR")}.\n` +
        `Tecnologia: Ethereum Virtual Machine (EVM) | Blockchain Local Ganache | Smart Contract: Solidity.`,
        { align: "center", lineGap: 2 }
      );

    doc.end();
  }
}

module.exports = new CertificateService();
