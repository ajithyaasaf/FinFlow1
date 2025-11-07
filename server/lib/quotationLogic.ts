import { adminDb } from "../firebaseAdmin";

interface PolicyThresholds {
  loanAmount: number;
  minInterestRate: number;
  maxTenure: number;
}

/**
 * Get current policy thresholds for high-value quotation detection
 */
export async function getPolicyThresholds(): Promise<PolicyThresholds> {
  try {
    const policyDoc = await adminDb.collection("policies").doc("default").get();
    
    if (policyDoc.exists) {
      const data = policyDoc.data();
      return data?.highValueThresholds || getDefaultThresholds();
    }
    
    return getDefaultThresholds();
  } catch (error) {
    console.error("Error fetching policy thresholds:", error);
    return getDefaultThresholds();
  }
}

function getDefaultThresholds(): PolicyThresholds {
  return {
    loanAmount: 1000000, // ₹10,00,000
    minInterestRate: 12, // 12%
    maxTenure: 60, // 60 months
  };
}

/**
 * Check if a quotation should be flagged as high-value
 * Returns { isHighValue: boolean, reasons: string[] }
 */
export async function checkHighValueQuotation(
  loanAmount: number,
  interestRate: number,
  tenure: number
): Promise<{ isHighValue: boolean; reasons: string[] }> {
  const thresholds = await getPolicyThresholds();
  const reasons: string[] = [];

  if (loanAmount > thresholds.loanAmount) {
    reasons.push("amount_exceeds_threshold");
  }

  if (interestRate < thresholds.minInterestRate) {
    reasons.push("low_interest_rate");
  }

  if (tenure > thresholds.maxTenure) {
    reasons.push("long_tenure");
  }

  return {
    isHighValue: reasons.length > 0,
    reasons,
  };
}

/**
 * Calculate EMI using reducing balance method
 * EMI = P × r × (1 + r)^n / ((1 + r)^n - 1)
 * where P = loan amount, r = monthly interest rate, n = tenure in months
 */
export function calculateEMI(
  loanAmount: number,
  annualInterestRate: number,
  tenureInMonths: number
): number {
  const monthlyRate = annualInterestRate / 12 / 100;
  const emi =
    (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, tenureInMonths)) /
    (Math.pow(1 + monthlyRate, tenureInMonths) - 1);
  
  return Math.round(emi);
}

/**
 * Generate unique quotation number in format Q-YYYY-XXXXX
 */
export async function generateQuotationNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const counterDoc = adminDb.collection("counters").doc("quotations");
  
  try {
    const result = await adminDb.runTransaction(async (transaction) => {
      const doc = await transaction.get(counterDoc);
      let count = 1;
      
      if (doc.exists) {
        const data = doc.data();
        if (data?.year === year) {
          count = (data.count || 0) + 1;
        }
      }
      
      transaction.set(counterDoc, { year, count }, { merge: true });
      
      return `Q-${year}-${String(count).padStart(5, '0')}`;
    });
    
    return result;
  } catch (error) {
    console.error("Error generating quotation number:", error);
    // Fallback to timestamp-based
    return `Q-${year}-${Date.now().toString().slice(-5)}`;
  }
}

/**
 * Generate unique loan number in format L-YYYY-XXXXX
 */
export async function generateLoanNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const counterDoc = adminDb.collection("counters").doc("loans");
  
  try {
    const result = await adminDb.runTransaction(async (transaction) => {
      const doc = await transaction.get(counterDoc);
      let count = 1;
      
      if (doc.exists) {
        const data = doc.data();
        if (data?.year === year) {
          count = (data.count || 0) + 1;
        }
      }
      
      transaction.set(counterDoc, { year, count }, { merge: true });
      
      return `L-${year}-${String(count).padStart(5, '0')}`;
    });
    
    return result;
  } catch (error) {
    console.error("Error generating loan number:", error);
    // Fallback to timestamp-based
    return `L-${year}-${Date.now().toString().slice(-5)}`;
  }
}
