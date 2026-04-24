import { clampQuantity } from './cartHelpers';
import { createZipBlob } from './zipBundle';

function safeSlug(value, fallback = 'file') {
  return (value || fallback)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || fallback;
}

function formatMoney(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function formatElement(element, index) {
  const value = element.type === 'logo' ? 'Uploaded logo' : element.value;
  return `${index + 1}. ${element.type.toUpperCase()} | value: ${value} | size: ${element.size} | x: ${Math.round(element.x)} | y: ${Math.round(element.y)}${element.color ? ` | color: ${element.color}` : ''}`;
}

function describeDesign(design = { elements: [] }) {
  const elements = Array.isArray(design?.elements) ? design.elements : [];
  return {
    count: elements.length,
    lines: elements.length > 0 ? elements.map(formatElement) : ['No elements placed'],
  };
}

function parseDataUrl(dataUrl) {
  const match = /^data:([^;,]+)?(;base64)?,(.*)$/i.exec(dataUrl);
  if (!match) return null;

  const mimeType = match[1] || 'application/octet-stream';
  const isBase64 = Boolean(match[2]);
  const body = match[3] || '';
  const byteString = isBase64 ? atob(body) : decodeURIComponent(body);
  const output = new Uint8Array(byteString.length);
  for (let i = 0; i < byteString.length; i += 1) {
    output[i] = byteString.charCodeAt(i);
  }
  return { mimeType, bytes: output };
}

async function resolveImageAsset(source) {
  if (!source) return null;

  if (source.startsWith('data:')) {
    const parsed = parseDataUrl(source);
    if (!parsed) return null;
    return { mimeType: parsed.mimeType, bytes: parsed.bytes };
  }

  const response = await fetch(source);
  if (!response.ok) {
    throw new Error(`Failed to fetch image asset: ${source}`);
  }
  const blob = await response.blob();
  return {
    mimeType: blob.type || 'application/octet-stream',
    bytes: new Uint8Array(await blob.arrayBuffer()),
  };
}

function extensionFromMime(mimeType) {
  if (mimeType === 'image/png') return 'png';
  if (mimeType === 'image/jpeg') return 'jpg';
  if (mimeType === 'image/svg+xml') return 'svg';
  if (mimeType === 'application/json') return 'json';
  if (mimeType === 'text/plain') return 'txt';
  return 'bin';
}

export function buildOrderData(items, totals) {
  const orderId =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `order-${Date.now()}`;

  const orderItems = items.map((item, index) => {
    const options = item.options || {};
    const metadata = item.metadata || {};
    const frontDesign = describeDesign(options.frontDesign);
    const backDesign = describeDesign(options.backDesign);
    const quantity = clampQuantity(item.quantity);

    return {
      lineNumber: index + 1,
      title: item.title,
      productId: item.productId,
      schoolName: metadata.schoolName || options.schoolName || '',
      schoolAddress: metadata.schoolAddress || options.schoolAddress || '',
      schoolMascot: metadata.schoolMascot || options.schoolMascot || '',
      divisionName: metadata.divisionName || options.divisionName || '',
      regionName: metadata.regionName || options.regionName || '',
      selectedColorName: metadata.selectedColorName || options.selectedColorName || 'Custom',
      selectedColorHex: metadata.selectedColorHex || options.selectedColorHex || options.color || '',
      size: options.size || '',
      quantity,
      price: Number(item.price || 0),
      subtotal: Number(item.price || 0) * quantity,
      imageUrl: item.previewImageURL || item.thumbnail || '',
      frontDesign,
      backDesign,
    };
  });

  return {
    orderId,
    createdAt: new Date().toISOString(),
    createdAtLabel: new Date().toLocaleString(),
    customer: 'Name / Email (to be filled in)',
    items: orderItems,
    subtotal: totals.subtotal,
    shipping: totals.shipping,
    tax: totals.tax,
    grandTotal: totals.grandTotal,
  };
}

export function formatOrderSummaryText(orderData) {
  const lines = [];
  lines.push(`Order ID: ${orderData.orderId}`);
  lines.push(`Created: ${orderData.createdAtLabel}`);
  lines.push(`Customer: ${orderData.customer}`);
  lines.push('');
  lines.push('Items:');

  orderData.items.forEach((item) => {
    lines.push(`${item.lineNumber}. ${item.title}`);
    lines.push(`   School: ${item.schoolName || 'N/A'} | Mascot: ${item.schoolMascot || 'N/A'}`);
    lines.push(`   Location: ${item.schoolAddress || 'N/A'}`);
    lines.push(`   Region: ${item.regionName || 'N/A'} | Division: ${item.divisionName || 'N/A'}`);
    lines.push(`   Color: ${item.selectedColorName}${item.selectedColorHex ? ` (${item.selectedColorHex})` : ''}`);
    lines.push(`   Size: ${item.size || 'N/A'} | Quantity: ${item.quantity}`);
    lines.push(`   Price: ${formatMoney(item.price)} | Subtotal: ${formatMoney(item.subtotal)}`);
    lines.push(`   Front design (${item.frontDesign.count}):`);
    item.frontDesign.lines.forEach((line) => lines.push(`      ${line}`));
    lines.push(`   Back design (${item.backDesign.count}):`);
    item.backDesign.lines.forEach((line) => lines.push(`      ${line}`));
    if (item.imageUrl) lines.push(`   Preview image: ${item.imageUrl}`);
    lines.push('');
  });

  lines.push(`Subtotal: ${formatMoney(orderData.subtotal)}`);
  lines.push(`Shipping: ${formatMoney(orderData.shipping)}`);
  lines.push(`Tax: ${formatMoney(orderData.tax)}`);
  lines.push(`Grand Total: ${formatMoney(orderData.grandTotal)}`);
  return lines.join('\n');
}

export function buildCheckoutEmail(orderData, zipFilename) {
  return {
    subject: `Order Package ${orderData.orderId}`,
    body: [
      'Order package ready.',
      '',
      `Order ID: ${orderData.orderId}`,
      `Created: ${orderData.createdAtLabel}`,
      `ZIP file: ${zipFilename}`,
      '',
      'Please attach the downloaded ZIP bundle from IDTrendz before sending this email.',
    ].join('\n'),
  };
}

export async function createOrderZip(orderData) {
  const files = [
    {
      name: 'order-summary.txt',
      data: formatOrderSummaryText(orderData),
    },
    {
      name: 'order-details.json',
      data: JSON.stringify(orderData, null, 2),
    },
  ];

  for (const item of orderData.items) {
    if (!item.imageUrl) continue;
    try {
      const asset = await resolveImageAsset(item.imageUrl);
      if (!asset) continue;
      const extension = extensionFromMime(asset.mimeType);
      files.push({
        name: `images/${String(item.lineNumber).padStart(2, '0')}-${safeSlug(item.title, 'jersey')}.${extension}`,
        data: asset.bytes,
      });
    } catch (error) {
      files.push({
        name: `images/${String(item.lineNumber).padStart(2, '0')}-${safeSlug(item.title, 'jersey')}-missing.txt`,
        data: `Image could not be bundled automatically.\nSource: ${item.imageUrl}\nReason: ${error.message}`,
      });
    }
  }

  const zipBlob = await createZipBlob(files);
  const zipFilename = `jersey-order-${safeSlug(orderData.orderId, 'bundle')}.zip`;
  return { zipBlob, zipFilename };
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
