import pdf from 'pdf-parse';
import mammoth from 'mammoth';
import { Buffer } from 'buffer';

/**
 * Extract text from PDF files
 */
export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    const data = await pdf(buffer);
    return data.text;
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    // Return an empty string instead of throwing an error
    // This allows the upload to continue with whatever text we can extract
    return "Error: Could not extract text from this PDF. The file may be corrupted, password-protected, or in an unsupported format.";
  }
}

/**
 * Extract text from DOCX files
 */
export async function extractTextFromDOCX(buffer: Buffer): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  } catch (error) {
    console.error('Error extracting text from DOCX:', error);
    return "Error: Could not extract text from this DOCX file. The file may be corrupted or in an unsupported format.";
  }
}

/**
 * Extract text from TXT files
 */
export function extractTextFromTXT(buffer: Buffer): string {
  try {
    return buffer.toString('utf-8');
  } catch (error) {
    console.error('Error extracting text from TXT:', error);
    return "Error: Could not extract text from this TXT file. The file may be corrupted or in an unsupported format.";
  }
}

/**
 * Extract text from a file based on its content type
 */
export async function extractTextFromFile(
  buffer: Buffer, 
  contentType: string
): Promise<string> {
  switch (contentType) {
    case 'application/pdf':
      return extractTextFromPDF(buffer);
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      return extractTextFromDOCX(buffer);
    case 'text/plain':
      return extractTextFromTXT(buffer);
    default:
      throw new Error(`Unsupported file type: ${contentType}`);
  }
}
