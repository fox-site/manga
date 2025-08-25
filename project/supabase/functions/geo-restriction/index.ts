/*
  # Геоблокировка для определенных стран
  
  Блокирует доступ из:
  - Южной Кореи (KR)
  - Германии (DE)
  - Китая (CN)
  - Японии (JP) - опционально
*/

interface RequestWithCountry extends Request {
  cf?: {
    country?: string;
  };
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// Заблокированные страны
const BLOCKED_COUNTRIES = ['KR', 'DE', 'CN', 'JP'];

// Сообщения для заблокированных стран
const BLOCK_MESSAGES = {
  'KR': '이 콘텐츠는 귀하의 지역에서 사용할 수 없습니다.',
  'DE': 'Dieser Inhalt ist in Ihrer Region nicht verfügbar.',
  'CN': '此内容在您的地区不可用。',
  'JP': 'このコンテンツはお住まいの地域ではご利用いただけません。',
  'default': 'This content is not available in your region.'
};

function getCountryFromRequest(request: Request): string | null {
  // Проверяем Cloudflare заголовки
  const cfCountry = (request as RequestWithCountry).cf?.country;
  if (cfCountry) return cfCountry;
  
  // Проверяем стандартные заголовки
  const countryHeader = request.headers.get('CF-IPCountry') || 
                       request.headers.get('X-Country-Code') ||
                       request.headers.get('CloudFront-Viewer-Country');
  
  return countryHeader;
}

function isBlocked(country: string | null): boolean {
  if (!country) return false;
  return BLOCKED_COUNTRIES.includes(country.toUpperCase());
}

function getBlockMessage(country: string): string {
  return BLOCK_MESSAGES[country] || BLOCK_MESSAGES.default;
}

Deno.serve(async (req: Request) => {
  try {
    if (req.method === "OPTIONS") {
      return new Response(null, {
        status: 200,
        headers: corsHeaders,
      });
    }

    const country = getCountryFromRequest(req);
    
    if (isBlocked(country)) {
      console.log(`🚫 Blocked access from: ${country}`);
      
      return new Response(
        JSON.stringify({
          blocked: true,
          country: country,
          message: getBlockMessage(country || 'default'),
          timestamp: new Date().toISOString()
        }),
        {
          status: 403,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          }
        }
      );
    }

    // Разрешенная страна
    return new Response(
      JSON.stringify({
        blocked: false,
        country: country,
        message: 'Access granted',
        timestamp: new Date().toISOString()
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        }
      }
    );

  } catch (error) {
    console.error('Geo-restriction error:', error);
    
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