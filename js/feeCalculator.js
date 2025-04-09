export function calculateCommissionFee(dealPrice, feeRates) {
    return dealPrice * feeRates.COMMISSION;
}

export function calculateServiceFee(dealPrice, feeRates) {
    return dealPrice * feeRates.SERVICE;
}

export function calculateTransactionFee(dealPrice, feeRates) {
    return dealPrice * feeRates.TRANSACTION;
}

export function calculateAllFees(dealPrice, feeRates) {
    return {
        commission: calculateCommissionFee(dealPrice, feeRates),
        service: calculateServiceFee(dealPrice, feeRates),
        transaction: calculateTransactionFee(dealPrice, feeRates)
    };
}