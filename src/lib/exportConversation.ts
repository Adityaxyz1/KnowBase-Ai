import jsPDF from 'jspdf';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  attachments?: Array<{
    name: string;
    type: string;
    preview?: string;
  }>;
}

interface ExportOptions {
  title: string;
  messages: Message[];
  format: 'markdown' | 'pdf';
}

function formatTimestamp(date: Date): string {
  return new Date(date).toLocaleString();
}

function stripMarkdown(text: string): string {
  return text
    .replace(/#{1,6}\s/g, '') // Headers
    .replace(/\*\*([^*]+)\*\*/g, '$1') // Bold
    .replace(/\*([^*]+)\*/g, '$1') // Italic
    .replace(/`([^`]+)`/g, '$1') // Inline code
    .replace(/```[\s\S]*?```/g, '[Code Block]') // Code blocks
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Links
    .replace(/^\s*[-*+]\s/gm, '• ') // Lists
    .replace(/^\s*\d+\.\s/gm, ''); // Numbered lists
}

export function exportToMarkdown({ title, messages }: ExportOptions): string {
  const lines: string[] = [
    `# ${title}`,
    '',
    `*Exported on ${formatTimestamp(new Date())}*`,
    '',
    '---',
    '',
  ];

  for (const msg of messages) {
    const role = msg.role === 'user' ? '👤 **You**' : '🤖 **Knowbase AI**';
    lines.push(`## ${role}`);
    lines.push(`*${formatTimestamp(msg.timestamp)}*`);
    lines.push('');
    lines.push(msg.content);
    
    if (msg.attachments && msg.attachments.length > 0) {
      lines.push('');
      lines.push('**Attachments:**');
      for (const att of msg.attachments) {
        lines.push(`- ${att.name} (${att.type})`);
      }
    }
    
    lines.push('');
    lines.push('---');
    lines.push('');
  }

  return lines.join('\n');
}

export function exportToPDF({ title, messages }: ExportOptions): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const maxWidth = pageWidth - 2 * margin;
  let yPos = margin;

  // Title
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(title, margin, yPos);
  yPos += 10;

  // Export date
  doc.setFontSize(10);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(128);
  doc.text(`Exported on ${formatTimestamp(new Date())}`, margin, yPos);
  yPos += 15;

  doc.setTextColor(0);

  for (const msg of messages) {
    // Check if we need a new page
    if (yPos > pageHeight - 40) {
      doc.addPage();
      yPos = margin;
    }

    // Role header
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    const roleLabel = msg.role === 'user' ? 'You' : 'Knowbase AI';
    doc.text(roleLabel, margin, yPos);
    yPos += 5;

    // Timestamp
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(128);
    doc.text(formatTimestamp(msg.timestamp), margin, yPos);
    yPos += 7;

    // Content
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0);
    
    const cleanContent = stripMarkdown(msg.content);
    const lines = doc.splitTextToSize(cleanContent, maxWidth);
    
    for (const line of lines) {
      if (yPos > pageHeight - margin) {
        doc.addPage();
        yPos = margin;
      }
      doc.text(line, margin, yPos);
      yPos += 5;
    }

    // Attachments
    if (msg.attachments && msg.attachments.length > 0) {
      yPos += 3;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'italic');
      doc.text('Attachments:', margin, yPos);
      yPos += 5;
      
      for (const att of msg.attachments) {
        doc.text(`• ${att.name}`, margin + 5, yPos);
        yPos += 4;
      }
    }

    yPos += 10;

    // Separator line
    doc.setDrawColor(200);
    doc.line(margin, yPos - 5, pageWidth - margin, yPos - 5);
    yPos += 5;
  }

  // Save the PDF
  const fileName = `${title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
  doc.save(fileName);
}

export function downloadMarkdown(content: string, title: string): void {
  const blob = new Blob([content], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${title.replace(/[^a-zA-Z0-9]/g, '_')}.md`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
