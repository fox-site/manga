/*
  # Создание таблицы пользователей

  1. Новые таблицы
    - `users`
      - `id` (uuid, primary key) - ID пользователя
      - `email` (text, unique) - Email пользователя
      - `username` (text) - Имя пользователя
      - `avatar_url` (text) - Ссылка на аватар
      - `bio` (text) - Описание профиля
      - `subscription_tier` (text) - Уровень подписки
      - `subscription_expires_at` (timestamp) - Дата окончания подписки
      - `total_donations` (integer) - Общая сумма донатов
      - `created_at` (timestamp) - Дата регистрации
      - `updated_at` (timestamp) - Дата обновления

  2. Безопасность
    - Включить RLS для таблицы users
    - Политика для чтения собственных данных
    - Политика для обновления собственного профиля
*/

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT auth.uid(),
  email text UNIQUE NOT NULL,
  username text NOT NULL,
  avatar_url text,
  bio text DEFAULT '',
  subscription_tier text DEFAULT 'free' CHECK (subscription_tier IN ('free', 'basic', 'premium', 'vip')),
  subscription_expires_at timestamptz,
  total_donations integer DEFAULT 0,
  is_admin boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Пользователи могут читать свои данные
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Пользователи могут обновлять свои данные
CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Все могут читать публичные профили
CREATE POLICY "Public profiles are viewable by everyone"
  ON users
  FOR SELECT
  TO public
  USING (true);

-- Функция для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();