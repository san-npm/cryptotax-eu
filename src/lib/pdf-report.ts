import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { TaxSummary, Country } from './types';

const COUNTRY_NAMES: Record<Country, string> = {
  france: 'France', germany: 'Germany', luxembourg: 'Luxembourg',
  belgium: 'Belgium', netherlands: 'Netherlands', generic: 'EU (Generic)',
};

export function generateTaxReport(summary: TaxSummary): void {
  const doc = new jsPDF();
  const countryName = COUNTRY_NAMES[summary.country];

  // Header
  doc.setFontSize(22);
  doc.setTextColor(79, 70, 229); // indigo
  doc.text('CryptoTax.eu', 14, 22);
  doc.setFontSize(10);
  doc.setTextColor(120, 120, 120);
  doc.text('Crypto Tax Report', 14, 30);

  // Summary box
  doc.setFontSize(16);
  doc.setTextColor(30, 30, 30);
  doc.text(`Tax Year ${summary.year} — ${countryName}`, 14, 45);
  doc.setFontSize(10);
  doc.text(`Calculation Method: ${summary.method.toUpperCase()}`, 14, 53);
  doc.text(`Generated: ${new Date().toLocaleDateString('en-GB')}`, 14, 59);

  // Summary table
  autoTable(doc, {
    startY: 68,
    head: [['Metric', 'Amount (EUR)']],
    body: [
      ['Total Gains', `+${summary.totalGains.toFixed(2)}`],
      ['Total Losses', `-${summary.totalLosses.toFixed(2)}`],
      ['Net Gain/Loss', summary.netGainLoss.toFixed(2)],
      ['Taxable Gains', summary.taxableGains.toFixed(2)],
      ['Estimated Tax', summary.estimatedTax.toFixed(2)],
    ],
    theme: 'grid',
    headStyles: { fillColor: [79, 70, 229] },
    styles: { fontSize: 10 },
  });

  // Country-specific notes
  const finalY = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY || 130;
  doc.setFontSize(11);
  doc.setTextColor(30, 30, 30);
  doc.text('Country-Specific Notes:', 14, finalY + 15);
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);

  const notes: Record<Country, string[]> = {
    france: ['Flat tax (PFU) of 30% applies to all crypto gains.', 'Report on Form 2086 with your annual tax return.', 'Foreign exchange accounts must be declared (Form 3916-bis).'],
    germany: ['Gains from crypto held <1 year are taxed as income.', 'Crypto held >1 year is tax-free (Haltefrist).', 'Annual exemption of EUR 600 for short-term gains.'],
    luxembourg: ['Gains tax-free if held >6 months for individuals.', 'Short-term gains taxed at marginal income tax rate.', 'Professional traders may be subject to different rules.'],
    belgium: ['Generally tax-free under "normal management of private wealth".', 'Speculative or professional trading may be taxable.', 'Consult a tax advisor if trading is frequent or leveraged.'],
    netherlands: ['Box 3 wealth tax on fictional yield, not actual gains.', 'Net assets above exemption threshold taxed at ~36%.', 'Crypto value on Jan 1 and Dec 31 determines tax base.'],
    generic: ['Consult your local tax authority for applicable rules.', 'This report shows raw capital gains and losses.'],
  };

  (notes[summary.country] || notes.generic).forEach((note, i) => {
    doc.text(`• ${note}`, 18, finalY + 25 + i * 7);
  });

  // Transaction details
  if (summary.details.length > 0) {
    doc.addPage();
    doc.setFontSize(14);
    doc.setTextColor(30, 30, 30);
    doc.text('Transaction Details', 14, 20);

    autoTable(doc, {
      startY: 28,
      head: [['Asset', 'Buy Date', 'Sell Date', 'Amount', 'Cost Basis', 'Proceeds', 'Gain/Loss', 'Taxable']],
      body: summary.details.map(d => [
        d.asset,
        new Date(d.buyDate).toLocaleDateString('en-GB'),
        new Date(d.sellDate).toLocaleDateString('en-GB'),
        d.amount.toFixed(6),
        `€${d.costBasis.toFixed(2)}`,
        `€${d.proceeds.toFixed(2)}`,
        `€${d.gain.toFixed(2)}`,
        d.taxable ? 'Yes' : 'No',
      ]),
      theme: 'striped',
      headStyles: { fillColor: [79, 70, 229], fontSize: 8 },
      styles: { fontSize: 7 },
    });
  }

  // Disclaimer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text('CryptoTax.eu — For informational purposes only. Not tax advice. Consult a qualified tax professional.', 14, 287);
    doc.text(`Page ${i} of ${pageCount}`, 185, 287);
  }

  doc.save(`CryptoTax_${summary.year}_${summary.country}.pdf`);
}
