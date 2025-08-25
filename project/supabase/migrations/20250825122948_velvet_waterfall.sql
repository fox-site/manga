/*
  # Создание таблицы подписок на уведомления

  1. Новые таблицы
    - `manga_subscriptions`
      - `id` (uuid, primary key) - ID подписки
      - `user_id` (uuid, foreign key) - Подписчик
      - `manga_id` (uuid, foreign key) - На что подписан
      - `created_at` (timestamp) - Дата подписки

  2. Безопасность
    - Включить RLS для таблицы manga_subscriptions
    - Пользователи могут управлять своими подписками
*/

CREATE TABLE IF NOT EXISTS manga_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  manga_id uuid NOT NULL REFERENCES manga(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, manga_id)
);

ALTER TABLE manga_subscriptions ENABLE ROW LEVEL SECURITY;

-- Пользователи могут читать свои подписки
CREATE POLICY "Users can read own subscriptions"
  ON manga_subscriptions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Пользователи могут создавать подписки
CREATE POLICY "Users can create subscriptions"
  ON manga_subscriptions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Пользователи могут удалять свои подписки
CREATE POLICY "Users can delete own subscriptions"
  ON manga_subscriptions
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);