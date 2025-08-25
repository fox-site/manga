/*
  # Создание таблицы манги

  1. Новые таблицы
    - `manga`
      - `id` (uuid, primary key) - ID тайтла
      - `title` (text) - Название
      - `description` (text) - Описание
      - `cover_url` (text) - Обложка
      - `type` (text) - Тип (Аниме/Манга)
      - `status` (text) - Статус выхода
      - `year` (integer) - Год выпуска
      - `rating` (numeric) - Средний рейтинг
      - `rating_count` (integer) - Количество оценок
      - `genres` (text[]) - Массив жанров
      - `categories` (text[]) - Массив категорий
      - `available_episodes` (integer) - Доступные серии
      - `total_episodes` (integer) - Всего серий
      - `current_donations` (integer) - Текущие донаты
      - `donation_goal` (integer) - Цель донатов
      - `subscription_tier` (text) - Требуемая подписка
      - `created_at` (timestamp) - Дата создания
      - `updated_at` (timestamp) - Дата обновления

  2. Безопасность
    - Включить RLS для таблицы manga
    - Публичное чтение для всех
    - Только админы могут изменять
*/

CREATE TABLE IF NOT EXISTS manga (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text DEFAULT '',
  cover_url text,
  type text DEFAULT 'Аниме' CHECK (type IN ('Аниме', 'Манга', 'Маньхуа', 'Манхва')),
  status text DEFAULT 'Выходит' CHECK (status IN ('Выходит', 'Завершён', 'Заморожен', 'Анонс')),
  year integer DEFAULT EXTRACT(YEAR FROM now()),
  rating numeric(3,1) DEFAULT 0 CHECK (rating >= 0 AND rating <= 10),
  rating_count integer DEFAULT 0,
  genres text[] DEFAULT '{}',
  categories text[] DEFAULT '{}',
  available_episodes integer DEFAULT 0,
  total_episodes integer DEFAULT 0,
  current_donations integer DEFAULT 0,
  donation_goal integer DEFAULT 10000,
  subscription_tier text DEFAULT 'free' CHECK (subscription_tier IN ('free', 'basic', 'premium', 'vip')),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE manga ENABLE ROW LEVEL SECURITY;

-- Все могут читать активную мангу
CREATE POLICY "Anyone can read active manga"
  ON manga
  FOR SELECT
  TO public
  USING (is_active = true);

-- Только админы могут изменять
CREATE POLICY "Only admins can modify manga"
  ON manga
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.is_admin = true
    )
  );

-- Триггер для обновления updated_at
CREATE TRIGGER update_manga_updated_at
  BEFORE UPDATE ON manga
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();