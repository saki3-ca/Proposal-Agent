import React, { useState } from 'react';
import { FinancialProposalData, FinancialItem } from '../../types';
import { FinancialCalculator } from '../../services/financialCalculator';
import { Calculator, ShieldAlert, Plus, Trash2, CheckCircle2, DollarSign } from 'lucide-react';

interface FinancialWorkspaceProps {
  initialData: FinancialProposalData;
  onSave: (data: FinancialProposalData) => void;
}

export const FinancialWorkspace: React.FC<FinancialWorkspaceProps> = ({ initialData, onSave }) => {
  const [data, setData] = useState<FinancialProposalData>(initialData);

  const updateItem = (index: number, field: keyof FinancialItem, value: any) => {
    const newItems = [...data.items];
    const item = { ...newItems[index], [field]: value };
    if (field === 'quantity' || field === 'unitRate') {
      item.totalFee = item.quantity * item.unitRate;
    }
    newItems[index] = item;

    const totals = FinancialCalculator.calculateTotals(newItems, data.vatRate, data.milestones);
    setData({ ...data, items: newItems, ...totals });
  };

  const addItem = () => {
    const newItem: FinancialItem = {
      id: `f-${Date.now()}`,
      feeType: 'Professional Fee - Specialist',
      description: 'Audit & verification tasks',
      quantity: 10,
      unitRate: 20000,
      totalFee: 200000
    };
    const newItems = [...data.items, newItem];
    const totals = FinancialCalculator.calculateTotals(newItems, data.vatRate, data.milestones);
    setData({ ...data, items: newItems, ...totals });
  };

  const removeItem = (index: number) => {
    const newItems = data.items.filter((_, i) => i !== index);
    const totals = FinancialCalculator.calculateTotals(newItems, data.vatRate, data.milestones);
    setData({ ...data, items: newItems, ...totals });
  };

  return (
    <div className="space-y-6">
      {/* Financial Safety Rule Warning Banner */}
      <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-start space-x-3 text-amber-900 text-xs">
        <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <h4 className="font-bold text-amber-900">Financial Safety Compliance Rule</h4>
          <p className="mt-0.5 leading-relaxed text-amber-800">
            Financial figures (fees, person-days, rates, VAT) are strictly calculated by application logic, not by AI reasoning. AI is restricted to drafting contextual assumptions.
          </p>
        </div>
      </div>

      {/* Main Fee Breakdown Table Grid */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Calculator className="w-5 h-5 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">Professional Fee Schedule Grid ({data.currency})</h3>
          </div>

          <button
            onClick={addItem}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-md shadow-xs transition-colors flex items-center space-x-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Fee Line Item</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Fee Category & Role</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4 w-24 text-right">Person-Days</th>
                <th className="py-3 px-4 w-32 text-right">Daily Rate ({data.currency})</th>
                <th className="py-3 px-4 w-36 text-right">Total Fee ({data.currency})</th>
                <th className="py-3 px-4 w-12 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {data.items.map((item, idx) => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="py-3 px-4">
                    <input
                      type="text"
                      value={item.feeType}
                      onChange={(e) => updateItem(idx, 'feeType', e.target.value)}
                      className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs font-sans text-slate-900 font-semibold"
                    />
                  </td>

                  <td className="py-3 px-4">
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => updateItem(idx, 'description', e.target.value)}
                      className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs font-sans text-slate-900"
                    />
                  </td>

                  <td className="py-3 px-4 text-right">
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateItem(idx, 'quantity', parseFloat(e.target.value) || 0)}
                      className="w-20 px-2 py-1 bg-white border border-slate-300 rounded text-xs text-right font-mono text-slate-900 font-bold"
                    />
                  </td>

                  <td className="py-3 px-4 text-right">
                    <input
                      type="number"
                      value={item.unitRate}
                      onChange={(e) => updateItem(idx, 'unitRate', parseFloat(e.target.value) || 0)}
                      className="w-28 px-2 py-1 bg-white border border-slate-300 rounded text-xs text-right font-mono text-slate-900 font-bold"
                    />
                  </td>

                  <td className="py-3 px-4 text-right font-bold text-slate-900">
                    {FinancialCalculator.formatCurrency(item.totalFee, '')}
                  </td>

                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => removeItem(idx)}
                      className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Calculation Totals Bar */}
        <div className="bg-slate-900 text-white p-5 border-t border-slate-800 space-y-2">
          <div className="flex justify-between text-xs font-mono text-slate-300">
            <span>Subtotal (Professional Fees & Reimbursables):</span>
            <span className="font-bold">{FinancialCalculator.formatCurrency(data.subtotal, data.currency)}</span>
          </div>

          <div className="flex justify-between text-xs font-mono text-slate-300">
            <span>Statutory VAT ({(data.vatRate * 100).toFixed(0)}%):</span>
            <span className="font-bold text-amber-400">{FinancialCalculator.formatCurrency(data.vatAmount, data.currency)}</span>
          </div>

          <div className="flex justify-between text-sm font-mono font-extrabold text-white border-t border-slate-800 pt-2">
            <span>Grand Total Proposal Value (Inclusive of VAT):</span>
            <span className="text-emerald-400 text-base">{FinancialCalculator.formatCurrency(data.grandTotal, data.currency)}</span>
          </div>
        </div>
      </div>

      {/* Payment Milestones Breakdown */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-3">
        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
          Payment Milestone Breakdown
        </h4>

        <div className="space-y-2 font-mono text-xs">
          {data.milestones.map((m, idx) => (
            <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900">{m.milestone} ({m.percentage}%)</span>
                <p className="text-[11px] text-slate-500 font-sans">{m.deliverable}</p>
              </div>
              <span className="font-bold text-indigo-700 text-xs">
                {FinancialCalculator.formatCurrency(m.amount, data.currency)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
