/*
  # Автоматическая модерация комментариев
  
  Функции:
  - Проверка на спам и нецензурную лексику
  - Автоматическое одобрение/отклонение
  - Уведомления модераторам
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

// Список запрещенных слов (базовый)
const BANNED_WORDS = [
  'спам', 'реклама', 'казино', 'ставки', 'кредит',
  // Добавьте свои запрещенные слова
];

// Проверка на спам
function isSpam(content: string): boolean {
  const lowerContent = content.toLowerCase();
  
  // Проверка на запрещенные слова
  for (const word of BANNED_WORDS) {
    if (lowerContent.includes(word)) {
      return true;
    }
  }
  
  // Проверка на повторяющиеся символы
  if (/(.)\1{10,}/.test(content)) {
    return true;
  }
  
  // Проверка на слишком много ссылок
  const linkCount = (content.match(/https?:\/\/\S+/g) || []).length;
  if (linkCount > 2) {
    return true;
  }
  
  return false;
}

// Очистка контента
function cleanContent(content: string): string {
  // Удаляем лишние пробелы
  content = content.replace(/\s+/g, ' ').trim();
  
  // Ограничиваем длину
  if (content.length > 1000) {
    content = content.substring(0, 1000) + '...';
  }
  
  return content;
}

interface CommentModerationRequest {
  commentId: string;
  content: string;
  userId: string;
  mangaId: string;
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
      const { commentId, content, userId, mangaId }: CommentModerationRequest = await req.json();

      if (!commentId || !content || !userId) {
        return new Response(
          JSON.stringify({ error: 'Missing required fields' }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }

      // Проверяем на спам
      const spam = isSpam(content);
      const cleanedContent = cleanContent(content);
      
      let moderationStatus = 'approved';
      let moderationReason = '';

      if (spam) {
        moderationStatus = 'rejected';
        moderationReason = 'Detected as spam';
      }

      // Обновляем комментарий
      const { error: updateError } = await supabase
        .from('comments')
        .update({
          content: cleanedContent,
          is_moderated: moderationStatus === 'approved',
          moderation_reason: moderationReason
        })
        .eq('id', commentId);

      if (updateError) {
        console.error('Error updating comment:', updateError);
        return new Response(
          JSON.stringify({ error: 'Database error' }),
          { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }

      // Если отклонен, уведомляем пользователя
      if (moderationStatus === 'rejected') {
        await supabase
          .from('notifications')
          .insert({
            user_id: userId,
            type: 'system',
            title: 'Комментарий отклонен',
            message: `Ваш комментарий был отклонен модерацией. Причина: ${moderationReason}`
          });
      }

      console.log(`🛡️ Comment moderated: ${commentId}, status: ${moderationStatus}`);

      return new Response(
        JSON.stringify({
          success: true,
          status: moderationStatus,
          reason: moderationReason,
          cleanedContent: cleanedContent
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
    console.error('Moderation error:', error);
    
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