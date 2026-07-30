import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, Clock3, RefreshCw, XCircle } from "lucide-react";
import { SEO } from "../components/JewelleryUI";
import { websiteApi, type WebsiteOrder } from "../lib/api";

const statusStyles = {
  Paid: {
    icon: CheckCircle2,
    title: "Payment successful",
    text: "Your order is confirmed and will move to processing.",
    className: "text-emerald-600",
  },
  Failed: {
    icon: XCircle,
    title: "Payment failed",
    text: "The payment was not completed. You can try checkout again.",
    className: "text-amber-600",
  },
  Pending: {
    icon: Clock3,
    title: "Payment pending",
    text: "PhonePe has not confirmed this payment yet. Check again in a moment.",
    className: "text-amber-600",
  },
};

const formatPrice = (value?: number) => `Rs. ${Number(value || 0).toLocaleString("en-IN")}`;

const PaymentStatusPage = () => {
  const [params] = useSearchParams();
  const transactionId = params.get("transactionId") || "";
  const [order, setOrder] = useState<WebsiteOrder | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<"Paid" | "Failed" | "Pending">("Pending");
  const [loading, setLoading] = useState(Boolean(transactionId));
  const [message, setMessage] = useState("");

  const checkStatus = async () => {
    if (!transactionId) {
      setMessage("Payment transaction id is missing.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      const data = await websiteApi.phonePeStatus(transactionId);
      setOrder(data.order);
      setPaymentStatus((data.paymentStatus as "Paid" | "Failed" | "Pending") || "Pending");
      localStorage.removeItem("annai_pending_phonepe");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to verify payment.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactionId]);

  useEffect(() => {
    if (!transactionId || paymentStatus !== "Pending") return undefined;
    let attempts = 0;
    const timer = window.setInterval(() => {
      attempts += 1;
      if (attempts > 12) {
        window.clearInterval(timer);
        return;
      }
      checkStatus();
    }, 5000);
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactionId, paymentStatus]);

  const view = statusStyles[paymentStatus] || statusStyles.Pending;
  const Icon = view.icon;

  return (
    <>
      <SEO title="Payment Status" description="Payment status for Annai Jewellery orders." />
      <section className="min-h-[72vh] bg-white px-4 py-8 text-amber-900 sm:px-6 lg:px-10">
        <div className="mx-auto max-w-2xl rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/60 sm:p-8">
          <div className="flex items-start gap-4">
            <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-slate-50 ${view.className}`}>
              {loading ? <RefreshCw className="h-7 w-7 animate-spin" /> : <Icon className="h-7 w-7" />}
            </div>
            <div>
              <p className="storefront-page-kicker">PhonePe Payment</p>
              <h1 className="storefront-page-title">{loading ? "Checking payment..." : view.title}</h1>
              <p className="storefront-page-copy">{loading ? "Please wait while we verify the transaction." : view.text}</p>
            </div>
          </div>

          {message && <p className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">{message}</p>}

          <div className="mt-7 rounded-3xl border border-slate-100 bg-slate-50 p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Transaction</p>
                <p className="mt-1 break-all text-sm font-semibold">{transactionId || "Not available"}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Status</p>
                <p className={`mt-1 text-sm font-semibold ${view.className}`}>{paymentStatus}</p>
              </div>
              {order && (
                <>
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Order</p>
                    <p className="mt-1 text-sm font-semibold">{order.orderId}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Amount</p>
                    <p className="mt-1 text-sm font-semibold">{formatPrice(order.amount)}</p>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <button onClick={checkStatus} disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 px-6 py-3 text-sm font-semibold disabled:opacity-60">
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Check again
            </button>
            <Link to="/my-orders" className="inline-flex items-center justify-center rounded-full bg-amber-600 px-6 py-3 text-sm font-semibold text-white">
              View my orders
            </Link>
            <Link to="/collection/products" className="inline-flex items-center justify-center rounded-full border border-amber-200 px-6 py-3 text-sm font-semibold text-amber-600">
              Back to shop
            </Link>
          </div>
        </div>
      </section>
    </>
  );
};

export default PaymentStatusPage;
