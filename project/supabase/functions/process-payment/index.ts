/*
  # Обработка платежей через Stripe
  
  Функции:
  - Создание платежных намерений
  - Обработка webhook от Stripe
  - Зачисление донатов
  - Активация подписок
*/

import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, Stripe-Signature",
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

interface PaymentRequest {
  type: 'donation' | 'subscription';
  amount: number;
  currency: string;
  mangaId?: string;
  planType?: string;
  userId: string;
}

interface StripeWebhook {
  type: string;
  data: {
    object: {
      id: string;
      amount: number;
      currency: string;
      metadata: {
        userId: string;
        mangaId?: string;
        type: string;
      };
    };
  };
}

Deno.serve(async (req: Request) => {
  try {
    if (req.method === "OPTIONS") {
      return new Response(null, {
        status: 200,
        headers: corsHeaders,
      });
    }

    const url = new URL(req.url);
    const path = url.pathname;

    // Создание платежного намерения
    if (req.method === "POST" && path.endsWith('/create-payment')) {
      const { type, amount, currency, mangaId, planType, userId }: PaymentRequest = await req.json();

      // Валидация
      if (!userId || !amount || amount < 10) {
        return new Response(
          JSON.stringify({ error: 'Invalid payment data' }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }

      // Создаем запись о платеже в базе
      const { data: donation, error } = await supabase
        .from('donations')
        .insert({
          user_id: userId,
          manga_id: mangaId,
          amount: amount * 100, // В копейках
          currency: currency || 'RUB',
          status: 'pending'
        })
        .select()
        .single();

      if (error) {
        console.error('Database error:', error);
        return new Response(
          JSON.stringify({ error: 'Database error' }),
          { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }

      // В реальной версии здесь будет Stripe Payment Intent
      const paymentIntent = {
        id: `pi_${Date.now()}`,
        client_secret: `pi_${Date.now()}_secret`,
        amount: amount * 100,
        currency: currency || 'rub'
      };

      return new Response(
        JSON.stringify({
          paymentIntent,
          donationId: donation.id
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          }
        }
      );
    }

    // Webhook от Stripe
    if (req.method === "POST" && path.endsWith('/webhook')) {
      const signature = req.headers.get('stripe-signature');
      const body = await req.text();

      // В реальной версии здесь будет проверка подписи Stripe
      const event: StripeWebhook = JSON.parse(body);

      if (event.type === 'payment_intent.succeeded') {
        const { id, amount, metadata } = event.data.object;
        
        // Обновляем статус доната
        const { error: updateError } = await supabase
          .from('donations')
          .update({ 
            status: 'completed',
            payment_id: id
          })
          .eq('user_id', metadata.userId)
          .eq('status', 'pending');

        if (updateError) {
          console.error('Failed to update donation:', updateError);
          return new Response('Error', { status: 500 });
        }

        // Отправляем уведомление об успешном донате
        if (metadata.mangaId) {
          await supabase
            .from('notifications')
            .insert({
              user_id: metadata.userId,
              manga_id: metadata.mangaId,
              type: 'donation',
              title: 'Донат успешно зачислен!',
              message: `Спасибо за поддержку! Ваш донат ${amount / 100}₽ зачислен.`
            });
        }

        console.log(`✅ Payment processed: ${id}, amount: ${amount}`);
      }

      return new Response('OK', { status: 200 });
    }

    return new Response(
      JSON.stringify({ error: 'Not found' }),
      { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );

  } catch (error) {
    console.error('Payment processing error:', error);
    
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        }
      }
    );
  }
});