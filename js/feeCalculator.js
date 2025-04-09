export function calculateCommissionFee(dealPrice, sellerVoucher, feeRates) {
    const commissionPrice = dealPrice - sellerVoucher;
    return {
        dealPrice: commissionPrice,
        fee: commissionPrice * feeRates.COMMISSION
    }
}

export function calculateServiceFee(dealPrice, sellerVoucher, feeRates) {
    const servicePrice = dealPrice - sellerVoucher;
    return {
        dealPrice: servicePrice,
        fee: servicePrice * feeRates.SERVICE
    }
}

export function calculateTransactionFee(dealPrice,  sellerVoucher, shippingFee, feeRates) {
    const shippingFeeInclSST = shippingFee * 1.06;
    const transactionPrice = dealPrice - sellerVoucher + shippingFeeInclSST;
    return {
        dealPrice: transactionPrice,
        fee: transactionPrice * feeRates.TRANSACTION
    };
}

export function calculateAllFees(dealPrice, sellerVoucher, shippingFee, feeRates) {
    return {
        commission: calculateCommissionFee(dealPrice, sellerVoucher, feeRates),
        service: calculateServiceFee(dealPrice, sellerVoucher, feeRates),
        transaction: calculateTransactionFee(dealPrice, sellerVoucher, shippingFee, feeRates)
    };
}