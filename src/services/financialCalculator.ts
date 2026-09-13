import { FinancialItem, FinancialProposalData, FinancialMilestone } from '../types';

export class FinancialCalculator {
  /**
   * Recalculates subtotal, VAT amount, and grand total for financial items.
   * All arithmetic is strictly calculated in TypeScript to avoid AI hallucination.
   */
  static calculateTotals(
    items: FinancialItem[],
    vatRate: number = 0.15,
    milestonesTemplate: { milestone: string; percentage: number; deliverable: string }[] = []
  ): Partial<FinancialProposalData> {
    const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitRate, 0);
    const vatAmount = Math.round(subtotal * vatRate);
    const grandTotal = subtotal + vatAmount;

    const milestones: FinancialMilestone[] = milestonesTemplate.map((m) => ({
      ...m,
      amount: Math.round((grandTotal * m.percentage) / 100)
    }));

    return {
      subtotal,
      vatRate,
      vatAmount,
      grandTotal,
      milestones
    };
  }

  /**
   * Formats numbers to currency string e.g. "BDT 4,025,000"
   */
  static formatCurrency(amount: number, currency: string = 'BDT'): string {
    return `${currency} ${amount.toLocaleString('en-US')}`;
  }
}
