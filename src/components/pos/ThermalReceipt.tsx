import { Printer, CheckCircle2, X } from 'lucide-react';
import { Button } from '../ui/Button';
import { formatPKDate, formatPKTime } from '../../utils/date';

export interface ReceiptItem {
  productName: string;
  productId?: string;
  size?: string;
  color?: string;
  qty: number;
  price: number;
  subtotal: number;
}

export interface ReceiptData {
  receiptNumber: string;
  date: string | Date;
  cashierName?: string;
  customerName?: string;
  customerPhone?: string;
  business?: {
    businessName?: string;
    address?: string;
    phone?: string;
    taxNumber?: string;
    currency?: string;
  };
  items: ReceiptItem[];
  subtotal: number;
  discount: number;
  discountType?: 'flat' | 'percentage';
  discountValue?: number;
  tax?: number;
  taxRate?: number;
  totalAmount: number;
  refundAmount?: number;
  returnStatus?: string;
  isReturnReceipt?: boolean;
  paymentMethod: string;
  cashTendered?: number;
  changeDue?: number;
  splitPayments?: { method: string; amount: number }[];
  cardDetails?: {
    cardType?: string;
    cardBank?: string;
    cardLast4?: string;
    cardRefNumber?: string;
  };
  bankTransferDetails?: {
    bankName?: string;
    refNumber?: string;
  };
  easypaisaDetails?: {
    mobileNumber?: string;
    trxId?: string;
  };
  note?: string;
}

interface ThermalReceiptProps {
  receipt: ReceiptData;
  onClose?: () => void;
  autoPrint?: boolean;
}

export default function ThermalReceipt({ receipt, onClose }: ThermalReceiptProps) {
  const storeName = receipt.business?.businessName || 'THREADLY APPAREL';
  const storeAddress = receipt.business?.address || 'Main Commercial Market, Lahore';
  const storePhone = receipt.business?.phone || 'Tel: +92 300 1234567';
  const taxNumber = receipt.business?.taxNumber;
  const currency = receipt.business?.currency || 'PKR';

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = formatPKDate(receipt.date);
  const formattedTime = formatPKTime(receipt.date, false);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-sm w-full overflow-hidden shadow-2xl border border-gray-100 flex flex-col my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Top Bar */}
        <div className="p-4 bg-brand-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="text-sm font-bold text-white">Sale Completed!</h3>
              <p className="text-[11px] text-brand-200">Receipt #{receipt.receiptNumber}</p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* 80mm Receipt Preview (Screen & Print Target) */}
        <div className="p-5 bg-gray-50 flex justify-center">
          <div
            id="thermal-receipt-print"
            className="w-[80mm] max-w-[300px] bg-white p-4 border border-gray-300 rounded shadow-xs font-mono text-[11px] text-black leading-tight space-y-2 select-text"
          >
            {/* Header */}
            <div className="text-center space-y-0.5 border-b border-dashed border-gray-400 pb-2">
              <h2 className="text-sm font-black tracking-wider uppercase">{storeName}</h2>
              <p className="text-[10px] text-gray-600">Style Your Clothing Business</p>
              <p className="text-[10px] text-gray-700">{storeAddress}</p>
              <p className="text-[10px] text-gray-700">{storePhone}</p>
              {taxNumber && <p className="text-[9px] text-gray-500">NTN/STRN: {taxNumber}</p>}
              {receipt.isReturnReceipt && (
                <div className="bg-gray-100 text-black py-0.5 px-2 font-black text-[10px] border border-black uppercase mt-1">
                  *** RETURN / REFUND VOUCHER ***
                </div>
              )}
            </div>

            {/* Receipt Meta */}
            <div className="text-[10px] space-y-0.5 border-b border-dashed border-gray-400 py-1.5">
              <div className="flex justify-between">
                <span>Receipt:</span>
                <span className="font-bold">{receipt.receiptNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>Date:</span>
                <span>{formattedDate} {formattedTime}</span>
              </div>
              <div className="flex justify-between">
                <span>Cashier:</span>
                <span>{receipt.cashierName || 'POS Counter 1'}</span>
              </div>
              <div className="flex justify-between">
                <span>Customer:</span>
                <span className="truncate max-w-[150px]">{receipt.customerName || 'Walk-in'}</span>
              </div>
              {receipt.customerPhone && (
                <div className="flex justify-between">
                  <span>Phone:</span>
                  <span>{receipt.customerPhone}</span>
                </div>
              )}
            </div>

            {/* Items Header */}
            <div className="pt-1">
              <div className="flex justify-between text-[10px] font-bold border-b border-black pb-1 mb-1">
                <span className="w-1/2">Item Description</span>
                <span className="w-1/6 text-center">Qty</span>
                <span className="w-1/6 text-right">Price</span>
                <span className="w-1/6 text-right">Total</span>
              </div>

              {/* Items List */}
              <div className="space-y-1.5 divide-y divide-gray-100 text-[10px]">
                {receipt.items.map((item, idx) => (
                  <div key={idx} className="pt-1">
                    <div className="font-semibold text-gray-900 leading-tight">
                      {item.productName}
                    </div>
                    {(item.size || item.color) && (
                      <div className="text-[9px] text-gray-600">
                        {item.size && `Size: ${item.size} `}
                        {item.color && `Color: ${item.color}`}
                      </div>
                    )}
                    <div className="flex justify-between text-gray-700 pt-0.5">
                      <span className="w-1/2 text-[9px] text-gray-500 font-mono">
                        {item.productId || ''}
                      </span>
                      <span className="w-1/6 text-center font-bold">{item.qty}</span>
                      <span className="w-1/6 text-right">{item.price}</span>
                      <span className="w-1/6 text-right font-semibold">{item.subtotal || item.qty * item.price}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Calculations & Totals */}
            <div className="border-t border-dashed border-gray-400 pt-2 space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{currency} {receipt.subtotal.toLocaleString()}</span>
              </div>
              {receipt.discount > 0 && (
                <div className="flex justify-between text-red-700">
                  <span>
                    Discount {receipt.discountType === 'percentage' ? `(${receipt.discountValue}%)` : '(Flat)'}:
                  </span>
                  <span>- {currency} {receipt.discount.toLocaleString()}</span>
                </div>
              )}
              {receipt.tax !== undefined && receipt.tax > 0 && (
                <div className="flex justify-between text-gray-700">
                  <span>Tax / GST ({receipt.taxRate || 0}%):</span>
                  <span>+ {currency} {receipt.tax.toLocaleString()}</span>
                </div>
              )}
              {receipt.refundAmount !== undefined && receipt.refundAmount > 0 && (
                <div className="flex justify-between text-amber-700 font-bold">
                  <span>Refunded Amount:</span>
                  <span>- {currency} {receipt.refundAmount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-xs font-black border-t border-b border-black py-1 my-1">
                <span>TOTAL DUE:</span>
                <span>{currency} {receipt.totalAmount.toLocaleString()}</span>
              </div>
            </div>

            {/* Payment & Change breakdown */}
            <div className="text-[10px] space-y-0.5 border-b border-dashed border-gray-400 pb-2">
              <div className="flex justify-between">
                <span>Payment Mode:</span>
                <span className="font-bold uppercase">{receipt.paymentMethod}</span>
              </div>
              <div className="pt-1 space-y-0.5 border-t border-dashed border-gray-300">
                <div className="flex justify-between font-bold text-emerald-800">
                  <span>Channel:</span>
                  <span>Easypaisa Mobile Wallet</span>
                </div>
                {receipt.easypaisaDetails?.mobileNumber && (
                  <div className="flex justify-between text-[9px] text-gray-600">
                    <span>Sender Account:</span>
                    <span className="font-mono">{receipt.easypaisaDetails.mobileNumber}</span>
                  </div>
                )}
                {receipt.easypaisaDetails?.trxId && (
                  <div className="flex justify-between text-[9px] text-gray-600">
                    <span>Easypaisa TRX ID:</span>
                    <span className="font-mono font-bold text-black">{receipt.easypaisaDetails.trxId}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-emerald-800 pt-0.5">
                  <span>Paid via Easypaisa:</span>
                  <span>{currency} {receipt.totalAmount.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Simulated Barcode */}
            <div className="text-center pt-2 space-y-1">
              <div className="inline-block py-1 px-3 bg-white border border-gray-300 rounded">
                <svg className="h-8 mx-auto w-48" viewBox="0 0 100 24" preserveAspectRatio="none">
                  <path
                    d="M2 0h2v24H2zm6 0h1v24H8zm3 0h3v24h-3zm5 0h1v24h-1zm3 0h2v24h-2zm4 0h1v24h-1zm3 0h3v24h-3zm5 0h1v24h-1zm3 0h2v24h-2zm4 0h2v24h-2zm5 0h1v24h-1zm3 0h3v24h-3zm5 0h1v24h-1zm3 0h2v24h-2zm4 0h1v24h-1zm3 0h3v24h-3zm5 0h1v24h-1zm3 0h2v24h-2zm4 0h1v24h-1z"
                    fill="currentColor"
                  />
                </svg>
                <p className="text-[9px] tracking-widest font-mono text-gray-600 mt-0.5">
                  *{receipt.receiptNumber}*
                </p>
              </div>
            </div>

            {/* Footer Notice */}
            <div className="text-center text-[9px] text-gray-500 pt-1 space-y-0.5 border-t border-dashed border-gray-300">
              <p className="font-bold text-gray-800">Thank you for shopping with us!</p>
              <p>Exchange allowed within 7 days with original receipt.</p>
              <p>Items must be unworn with original tags attached.</p>
              <p className="text-[8px] text-gray-400 pt-0.5">Powered by Threadly POS Suite</p>
            </div>
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div className="p-4 bg-white border-t border-gray-200 flex gap-2.5">
          <Button
            variant="primary"
            onClick={handlePrint}
            className="flex-1 text-xs py-2.5 font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-sm bg-brand-800 hover:bg-brand-900"
          >
            <Printer className="w-4 h-4" />
            Print 80mm Receipt
          </Button>
          {onClose && (
            <Button
              variant="outline"
              onClick={onClose}
              className="text-xs py-2.5 px-4 font-semibold cursor-pointer"
            >
              New Sale
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
