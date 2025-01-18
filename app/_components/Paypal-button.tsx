
import { PayPalButtons, usePayPalScriptReducer } from "@paypal/react-paypal-js";

const PayPalButton = ({ amount, onSuccess }: { amount: string, onSuccess: () => void }) => {
  const [{ isPending }] = usePayPalScriptReducer();

  return (
    <div>
      {isPending ? <div>Loading...</div> : null}
      <PayPalButtons
        createOrder={(data, actions) => {
          return actions.order.create({
            intent: "CAPTURE",
            purchase_units: [
              {
                amount: {
                  value: amount,
                  currency_code: "USD",
                },
              },
            ],
          });
        }}
        onApprove={async (data, actions) => {
          try {
            const details = await actions?.order?.capture();
            onSuccess();
            console.log("Payment successful: ", details);
          } catch (error) {
            console.error("Payment capture error: ", error);
          }
        }}
        onError={(error) => {
          console.error("PayPal Button Error: ", error);
        }}
      />
    </div>
  );
};

export default PayPalButton;
