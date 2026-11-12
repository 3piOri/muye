create table if not exists public.products (
    id uuid primary key default gen_random_uuid(),
    image text not null,
    name text not null,
    description text not null,
    price text not null,
    whatsapp_url text not null,
    tag text,
    sort_order integer not null default 0
);

create index if not exists products_sort_order_idx on public.products (sort_order);

create table if not exists public.admin_users (
    user_id uuid primary key references auth.users (id) on delete cascade
);

alter table public.products enable row level security;
alter table public.admin_users enable row level security;

revoke insert, update, delete on public.products from anon;
grant select on public.products to anon, authenticated;
grant insert, update, delete on public.products to authenticated;
revoke all on public.admin_users from anon, authenticated;
grant select on public.admin_users to authenticated;

drop policy if exists "Anyone can view products" on public.products;
create policy "Anyone can view products"
    on public.products for select
    to anon, authenticated
    using (true);

drop policy if exists "Admins can add products" on public.products;
create policy "Admins can add products"
    on public.products for insert
    to authenticated
    with check (
        exists (
            select 1
            from public.admin_users
            where user_id = (select auth.uid())
        )
    );

drop policy if exists "Admins can update products" on public.products;
create policy "Admins can update products"
    on public.products for update
    to authenticated
    using (
        exists (
            select 1
            from public.admin_users
            where user_id = (select auth.uid())
        )
    )
    with check (
        exists (
            select 1
            from public.admin_users
            where user_id = (select auth.uid())
        )
    );

drop policy if exists "Admins can delete products" on public.products;
create policy "Admins can delete products"
    on public.products for delete
    to authenticated
    using (
        exists (
            select 1
            from public.admin_users
            where user_id = (select auth.uid())
        )
    );

drop policy if exists "Admins can view their own access" on public.admin_users;
create policy "Admins can view their own access"
    on public.admin_users for select
    to authenticated
    using (user_id = (select auth.uid()));

insert into public.products (image, name, description, price, whatsapp_url, tag, sort_order)
select seed.image, seed.name, seed.description, seed.price, seed.whatsapp_url, seed.tag, seed.sort_order
from (
    values
        (
            'colcha.jfif',
            'Kiruto "MUYË"',
            'Colcha confeccionada con retazos de tela con estampado exclusivo de alta densidad.',
            '$2,650 MXN',
            'https://wa.me/525550648075?text=Hola!%20Me%20interesa%20comprar%20la%20Colcha%20Muyë',
            'Nuevo',
            0
        ),
        (
            'monedero.jfif',
            'Monedero "Saifu"',
            'Cartera/monedero de diseño tradicional y único.',
            '$380 MXN',
            'https://wa.me/525550648075?text=Hola!%20Me%20interesa%20comprar%20el%20Monedero%20Sakura%20Cyber',
            null,
            1
        ),
        (
            '6.png',
            'Las trianguladas "Upcycle textile collection"',
            'AKARI. Bolsita artesanal inspirada en el diseño japonés que evoca la tradicional kinchaku. Confeccionada con telas reutilizadas, Explora el color, las formas geométricas y los detalles textiles.Esta pieza cuenta con ocho presillas de tela para el cordón de cierre.',
            '$1,190 MXN',
            'https://wa.me/525550648075?text=Hola!%20Me%20interesa%20comprar%20la%20bolsita%20Akari',
            null,
            2
        ),
        (
            '7.png',
            'Bolsita "Kinchaku"',
            'Bolsita para monedas, un amuleto de la suerte o una cajita para regalar joyas. Técnica tradicional de plegado y costura',
            '$370 MXN',
            'https://wa.me/525550648075?text=Hola!%20Me%20interesa%20comprar%20la%20bolsita%20kinchaku',
            null,
            3
        )
) as seed(image, name, description, price, whatsapp_url, tag, sort_order)
where not exists (select 1 from public.products);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
    'product-images',
    'product-images',
    true,
    10485760,
    array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Admins can upload product images" on storage.objects;
create policy "Admins can upload product images"
    on storage.objects for insert
    to authenticated
    with check (
        bucket_id = 'product-images'
        and exists (
            select 1
            from public.admin_users
            where user_id = (select auth.uid())
        )
    );

drop policy if exists "Admins can update product images" on storage.objects;
create policy "Admins can update product images"
    on storage.objects for update
    to authenticated
    using (
        bucket_id = 'product-images'
        and exists (
            select 1
            from public.admin_users
            where user_id = (select auth.uid())
        )
    )
    with check (
        bucket_id = 'product-images'
        and exists (
            select 1
            from public.admin_users
            where user_id = (select auth.uid())
        )
    );

drop policy if exists "Admins can delete product images" on storage.objects;
create policy "Admins can delete product images"
    on storage.objects for delete
    to authenticated
    using (
        bucket_id = 'product-images'
        and exists (
            select 1
            from public.admin_users
            where user_id = (select auth.uid())
        )
    );
