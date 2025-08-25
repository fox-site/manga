/*
  # Создание таблицы комментариев

  1. Новые таблицы
    - `comments`
      - `id` (uuid, primary key) - ID комментария
      - `user_id` (uuid, foreign key) - Автор комментария
      - `manga_id` (uuid, foreign key) - К какой манге
      - `episode_number` (integer) - К какой серии
      - `content` (text) - Текст комментария
      - `likes` (integer) - Количество лайков
      - `is_moderated` (boolean) - Прошел модерацию
      - `created_at` (timestamp) - Дата создания

  2. Безопасность
    - Включить RLS для таблицы comments
    - Пользователи могут читать модерированные комментарии
    - Пользователи могут создавать свои комментарии
    - Пользователи могут редактировать только свои комментарии
*/

CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  manga_id uuid NOT NULL REFERENCES manga(id) ON DELETE CASCADE,
  episode_number integer DEFAULT 1,
  content text NOT NULL,
  likes integer DEFAULT 0,
  is_moderated boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Все могут читать модерированные комментарии
CREATE POLICY "Anyone can read moderated comments"
  ON comments
  FOR SELECT
  TO public
  USING (is_moderated = true);

-- Авторизованные пользователи могут создавать комментарии
CREATE POLICY "Authenticated users can create comments"
  ON comments
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Пользователи могут обновлять свои комментарии
CREATE POLICY "Users can update own comments"
  ON comments
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Админы могут модерировать любые комментарии
CREATE POLICY "Admins can moderate all comments"
  ON comments
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
CREATE TRIGGER update_comments_updated_at
  BEFORE UPDATE ON comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();