/*
  # Отправка уведомлений о новых сериях
  
  Функции:
  - Уведомления подписчикам о новых сериях
  - Email уведомления
  - Push уведомления (будущее)
*/

import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

interface NotificationRequest {
  mangaId: string;
  episodeNumber: number;
  episodeTitle?: string;
}

Deno.serve(async (req: Request) => {
  try {
    if (req.method === "OPTIONS") {
      return new Response(null, {
        status: 200,
        headers: corsHeaders,
      });
    }

    if (req.method === "POST") {
      const { mangaId, episodeNumber, episodeTitle }: NotificationRequest = await req.json();

      if (!mangaId || !episodeNumber) {
        return new Response(
          JSON.stringify({ error: 'Missing required fields' }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }

      // Получаем информацию о манге
      const { data: manga, error: mangaError } = await supabase
        .from('manga')
        .select('title, cover_url')
        .eq('id', mangaId)
        .single();

      if (mangaError || !manga) {
        return new Response(
          JSON.stringify({ error: 'Manga not found' }),
          { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }

      // Получаем всех подписчиков этой манги
      const { data: subscriptions, error: subsError } = await supabase
        .from('manga_subscriptions')
        .select('user_id')
        .eq('manga_id', mangaId);

      if (subsError) {
        console.error('Error fetching subscriptions:', subsError);
        return new Response(
          JSON.stringify({ error: 'Database error' }),
          { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }

      if (!subscriptions || subscriptions.length === 0) {
        return new Response(
          JSON.stringify({ message: 'No subscribers found' }),
          { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }

      // Создаем уведомления для всех подписчиков
      const notifications = subscriptions.map(sub => ({
        user_id: sub.user_id,
        manga_id: mangaId,
        type: 'new_episode',
        title: 'Новая серия!',
        message: `Вышла серия ${episodeNumber} тайтла "${manga.title}"${episodeTitle ? `: ${episodeTitle}` : ''}`,
        episode_number: episodeNumber
      }));

      const { error: notifError } = await supabase
        .from('notifications')
        .insert(notifications);

      if (notifError) {
        console.error('Error creating notifications:', notifError);
        return new Response(
          JSON.stringify({ error: 'Failed to create notifications' }),
          { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }

      console.log(`📢 Sent ${notifications.length} notifications for ${manga.title} episode ${episodeNumber}`);

      return new Response(
        JSON.stringify({
          success: true,
          notificationsSent: notifications.length,
          manga: manga.title,
          episode: episodeNumber
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

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );

  } catch (error) {
    console.error('Notification error:', error);
    
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