import axios from "axios";

const FIREBASE_FUNCTION_URL = "https://initiatestkpush-gywqdew72q-uc.a.run.app";

export const initiatePayment = async (
  phone,
  amount,
  accountReference = "GraceChurch"
) => {
  try {
    const response = await axios.post(FIREBASE_FUNCTION_URL, {
      phone,
      amount,
      accountReference,
    });
    return response.data;
  } catch (error) {
    console.error("Mpesa Payment Error:", error);
    throw error;
  }
};
