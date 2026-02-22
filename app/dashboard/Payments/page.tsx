import { requireActiveBusinessId, getBusinessById } from "@/lib/tenant";
import { getDb } from "@/lib/mongodb";
import StripeConnectButton from "@/app/components/StripeConnectButton";
import PayPalConnectButton from "@/app/components/Paypalconnectbutton";
import SquareConnectButton from "@/app/components/Squareconnectbutton";

export const runtime = "nodejs";

export default async function PaymentSettingsPage() {
  const { businessId } = await requireActiveBusinessId();
  const db = await getDb();

  // Get business with payment settings
  const business = await getBusinessById(businessId);
  
  // Get payment gateway settings from database
  const settingsCol = db.collection("payment_settings");
  const paymentSettings = await settingsCol.findOne({ businessId });

  const stripeConnected = !!paymentSettings?.stripe?.accountId;
  const paypalConnected = !!paymentSettings?.paypal?.merchantId;
  const squareConnected = !!paymentSettings?.square?.merchantId;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-white">
          Payment Settings
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Connect your payment gateway to charge customers
        </p>
      </div>

      {/* Payment Gateways */}
      <div className="space-y-4">
        {/* Stripe */}
        <div className="overflow-hidden rounded-2xl border border-black/10 bg-white ring-1 ring-black/5
                        dark:border-white/10 dark:bg-white/5 dark:ring-white/10">
          <div className="px-6 py-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/10 ring-1 ring-indigo-500/20">
                  <svg className="h-6 w-6 text-indigo-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.594-7.305h.003z"/>
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-semibold text-zinc-900 dark:text-white">
                    Stripe
                  </h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    Accept credit cards, ACH, and more
                  </p>
                  {stripeConnected && (
                    <div className="mt-1 flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-300">
                      <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
                      Connected
                    </div>
                  )}
                </div>
              </div>

              <StripeConnectButton 
                businessId={businessId}
                isConnected={stripeConnected}
                accountId={paymentSettings?.stripe?.accountId}
              />
            </div>
          </div>
        </div>

        {/* PayPal */}
        <div className="overflow-hidden rounded-2xl border border-black/10 bg-white ring-1 ring-black/5
                        dark:border-white/10 dark:bg-white/5 dark:ring-white/10">
          <div className="px-6 py-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 ring-1 ring-blue-500/20">
                  <svg className="h-6 w-6 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.254-.93 4.778-4.005 7.201-9.138 7.201h-2.19a.563.563 0 0 0-.556.479l-1.187 7.527h-.506l-.24 1.516a.56.56 0 0 0 .554.647h3.882c.46 0 .85-.334.922-.788.06-.26.76-4.852.76-4.852.072-.455.462-.788.922-.788h.58c3.76 0 6.705-1.528 7.565-5.946.36-1.847.174-3.388-.766-4.46z"/>
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-semibold text-zinc-900 dark:text-white">
                    PayPal
                  </h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    Accept PayPal and Venmo
                  </p>
                  {paypalConnected && (
                    <div className="mt-1 flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-300">
                      <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
                      Connected
                    </div>
                  )}
                </div>
              </div>

              <PayPalConnectButton 
                businessId={businessId}
                isConnected={paypalConnected}
              />
            </div>
          </div>
        </div>

        {/* Square */}
        <div className="overflow-hidden rounded-2xl border border-black/10 bg-white ring-1 ring-black/5
                        dark:border-white/10 dark:bg-white/5 dark:ring-white/10">
          <div className="px-6 py-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-900/10 ring-1 ring-zinc-900/20
                                dark:bg-white/10 dark:ring-white/20">
                  <svg className="h-6 w-6 text-zinc-900 dark:text-white" fill="currentColor" viewBox="0 0 24 24">
                    <rect width="24" height="24" rx="4"/>
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-semibold text-zinc-900 dark:text-white">
                    Square
                  </h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    Accept payments with Square
                  </p>
                  {squareConnected && (
                    <div className="mt-1 flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-300">
                      <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
                      Connected
                    </div>
                  )}
                </div>
              </div>

              <SquareConnectButton 
                businessId={businessId}
                isConnected={squareConnected}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 p-4
                      dark:border-blue-500/30 dark:bg-blue-500/20">
        <div className="flex gap-3">
          <svg className="h-5 w-5 shrink-0 text-blue-700 dark:text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-sm text-blue-800 dark:text-blue-200">
            <p className="font-semibold mb-1">How it works</p>
            <ul className="space-y-1 text-blue-700 dark:text-blue-300">
              <li>• Connect your own payment gateway account</li>
              <li>• Payments go directly to your account</li>
              <li>• You control fees and payment settings</li>
              <li>• Disconnect anytime from your gateway dashboard</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}