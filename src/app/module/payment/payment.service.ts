/* eslint-disable @typescript-eslint/no-explicit-any */
import Stripe from "stripe";
import { PaymentStatus } from "../../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";


const handlerStripeWebhookEvent = async (event : Stripe.Event) =>{

    const existingPayment = await prisma.payment.findFirst({
        where:{
            stripeEventId : event.id
        }
    })

    if(existingPayment){
        console.log(`Event ${event.id} already processed. Skipping`);
        return {message : `Event ${event.id} already processed. Skipping`}
    }

    switch (event.type) {
        case "checkout.session.completed": {
            const session = event.data.object as Stripe.Checkout.Session;

            const appointmentId = session.metadata?.appointmentId

            const paymentId = session.metadata?.paymentId

            if(!appointmentId || !paymentId){
                console.error("Missing appointmentId or paymentId in session metadata");
                return {message : "Missing appointmentId or paymentId in session metadata"}
            }

            const appointment = await prisma.appointment.findUnique({
                where : {
                    id : appointmentId
                }
            })

            if(!appointment){
                console.error(`Appointment with id ${appointmentId} not found`);
                return {message : `Appointment with id ${appointmentId} not found`}
            }

            await prisma.$transaction(async (tx) => {
                await tx.appointment.update({
                    where : {
                        id : appointmentId
                    },
                    data : {
                        paymentStatus : session.payment_status === "paid" ? PaymentStatus.PAID : PaymentStatus.UNPAID
                    }
                });

                await tx.payment.update({
                    where : {
                        id : paymentId
                    },
                    data: {
                        stripeEventId: event.id,
                        status: session.payment_status === "paid" ? PaymentStatus.PAID : PaymentStatus.UNPAID,
                        paymentGatewayData: session as any,
                    }
                });
            });

            console.log(`Processed checkout.session.completed for appointment ${appointmentId} and payment ${paymentId}`);
            break;
        }

        case "checkout.session.expired": {
            const session = event.data.object as Stripe.Checkout.Session;
            console.log(`Checkout session ${session.id} expired. Marking associated payment as failed.`);
            
            // You might want to handle expired sessions by updating payment status
            const paymentId = session.metadata?.paymentId;
            if (paymentId) {
                await prisma.payment.update({
                    where: { id: paymentId },
                    data: { 
                        status: PaymentStatus.UNPAID,
                        stripeEventId: event.id 
                    }
                });
            }
            break;
        }

        case "payment_intent.payment_failed": {
            const paymentIntent = event.data.object as Stripe.PaymentIntent;
            console.log(`Payment intent ${paymentIntent.id} failed. Marking associated payment as failed.`);
            
            // Handle failed payments
            break;
        }
        default :
            console.log(`Unhandled event type ${event.type}`);
    }

    return { message: `Webhook Event ${event.id} processed successfully` };
};

export const PaymentService = {
    handlerStripeWebhookEvent
};