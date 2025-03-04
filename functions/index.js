const functions = require("firebase-functions");
const axios = require("axios");
const admin = require("firebase-admin");

admin.initializeApp();

const MPESA_CONSUMER_KEY = "mwlhG06Fwd9ZIjXmX9sorGjUyLJroBNiSdgik4Xuuk2OcRAW";
const MPESA_CONSUMER_SECRET =
  "7AfHhEgVIflnSejIQ2XeICIAfGPY47wtYRM4kkPawkJuZ5yox8DIAcgR3nB2S6lO";
const MPESA_SHORTCODE = "174379";
const MPESA_PASSKEY =
  "bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919";
const CALLBACK_URL = "https://mpesacallback-gywqdew72q-uc.a.run.app";

const getAccessToken = async () => {
  const auth = Buffer.from(
      `${MPESA_CONSUMER_KEY}:${MPESA_CONSUMER_SECRET}`,
  ).toString("base64");
  const response = await axios.get(
      "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
      {
        headers: {Authorization: `Basic ${auth}`},
      },
  );
  return response.data.access_token;
};

exports.initiateSTKPush = functions.https.onRequest(async (req, res) => {
  try {
    const {phone, amount} = req.body;
    const token = await getAccessToken();
    const getTimestamp = () => {
      const date = new Date();
      return date
          .toISOString()
          .replace(/[-T:.Z]/g, "")
          .substring(0, 14);
    };
    const timestamp = getTimestamp();
    const password = Buffer.from(
        `${MPESA_SHORTCODE}${MPESA_PASSKEY}${timestamp}`,
    ).toString("base64");

    const response = await axios.post(
        "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
        {
          BusinessShortCode: MPESA_SHORTCODE,
          Password: password,
          Timestamp: timestamp,
          TransactionType: "CustomerPayBillOnline",
          Amount: amount,
          PartyA: phone,
          PartyB: MPESA_SHORTCODE,
          PhoneNumber: phone,
          CallBackURL: CALLBACK_URL,
          AccountReference: "GraceChurch",
          TransactionDesc: "Church Donation",
        },
        {
          headers: {Authorization: `Bearer ${token}`},
        },
    );

    res.json({success: true, data: response.data});
    console.log("Safaricom Response:", response.data);
    console.log("Generated Password:", password);
    console.log("Timestamp:", timestamp);
  } catch (error) {
    res.status(400).json({success: false, error: error.message});
    console.error("Mpesa Error:", error.message);
  }
});

exports.mpesaCallback = functions.https.onRequest(async (req, res) => {
  console.log("Mpesa Callback Received:", JSON.stringify(req.body, null, 2));

  if (!req.body || !req.body.Body || !req.body.Body.stkCallback) {
    console.error("Invalid Mpesa Callback Data:", req.body);
    return res.status(400).send("Invalid callback data");
  }

  const callbackData = req.body.Body.stkCallback;

  const {
    MerchantRequestID,
    CheckoutRequestID,
    ResultCode,
    ResultDesc,
    CallbackMetadata,
  } = callbackData;

  console.log("Transaction Result:", ResultCode, ResultDesc);

  const db = admin.firestore();
  await db.collection("mpesaTransactions").doc(CheckoutRequestID).set({
    MerchantRequestID,
    CheckoutRequestID,
    ResultCode,
    ResultDesc,
    CallbackMetadata,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
  });

  res.sendStatus(200);
});
