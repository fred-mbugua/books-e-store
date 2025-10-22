--
-- PostgreSQL database dump
--

-- Dumped from database version 16.2
-- Dumped by pg_dump version 16.0

-- Started on 2025-10-22 19:55:03

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 2 (class 3079 OID 786221)
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- TOC entry 4941 (class 0 OID 0)
-- Dependencies: 2
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 224 (class 1259 OID 786316)
-- Name: action_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.action_logs (
    log_id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid,
    action_type character varying(50) NOT NULL,
    details jsonb,
    "timestamp" timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.action_logs OWNER TO postgres;

--
-- TOC entry 221 (class 1259 OID 786267)
-- Name: books; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.books (
    book_id uuid DEFAULT gen_random_uuid() NOT NULL,
    title character varying(255) NOT NULL,
    author character varying(255) NOT NULL,
    isbn character varying(50),
    description text,
    price numeric(10,2) NOT NULL,
    stock_quantity integer DEFAULT 0 NOT NULL,
    image_url character varying(255),
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    category_id integer
);


ALTER TABLE public.books OWNER TO postgres;

--
-- TOC entry 226 (class 1259 OID 794398)
-- Name: categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.categories (
    category_id integer NOT NULL,
    category_name character varying(100) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.categories OWNER TO postgres;

--
-- TOC entry 225 (class 1259 OID 794397)
-- Name: categories_category_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.categories_category_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.categories_category_id_seq OWNER TO postgres;

--
-- TOC entry 4942 (class 0 OID 0)
-- Dependencies: 225
-- Name: categories_category_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.categories_category_id_seq OWNED BY public.categories.category_id;


--
-- TOC entry 223 (class 1259 OID 786300)
-- Name: order_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.order_items (
    item_id uuid DEFAULT gen_random_uuid() NOT NULL,
    order_id uuid NOT NULL,
    book_id uuid NOT NULL,
    quantity integer NOT NULL,
    price_at_purchase numeric(10,2) NOT NULL
);


ALTER TABLE public.order_items OWNER TO postgres;

--
-- TOC entry 219 (class 1259 OID 786242)
-- Name: order_statuses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.order_statuses (
    status_id integer NOT NULL,
    status_name character varying(50) NOT NULL
);


ALTER TABLE public.order_statuses OWNER TO postgres;

--
-- TOC entry 218 (class 1259 OID 786241)
-- Name: order_statuses_status_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.order_statuses_status_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.order_statuses_status_id_seq OWNER TO postgres;

--
-- TOC entry 4943 (class 0 OID 0)
-- Dependencies: 218
-- Name: order_statuses_status_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.order_statuses_status_id_seq OWNED BY public.order_statuses.status_id;


--
-- TOC entry 222 (class 1259 OID 786281)
-- Name: orders; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.orders (
    order_id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    guest_email character varying(100),
    guest_name character varying(255),
    guest_phone character varying(20),
    shipping_address text NOT NULL,
    total_amount numeric(10,2) NOT NULL,
    status_id integer NOT NULL,
    order_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.orders OWNER TO postgres;

--
-- TOC entry 217 (class 1259 OID 786233)
-- Name: user_roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_roles (
    role_id integer NOT NULL,
    role_name character varying(50) NOT NULL
);


ALTER TABLE public.user_roles OWNER TO postgres;

--
-- TOC entry 216 (class 1259 OID 786232)
-- Name: user_roles_role_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.user_roles_role_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_roles_role_id_seq OWNER TO postgres;

--
-- TOC entry 4944 (class 0 OID 0)
-- Dependencies: 216
-- Name: user_roles_role_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.user_roles_role_id_seq OWNED BY public.user_roles.role_id;


--
-- TOC entry 220 (class 1259 OID 786250)
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    user_id uuid DEFAULT gen_random_uuid() NOT NULL,
    email character varying(100) NOT NULL,
    password_hash character varying(255) NOT NULL,
    first_name character varying(100) NOT NULL,
    last_name character varying(100) NOT NULL,
    phone_number character varying(20),
    role_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.users OWNER TO postgres;

--
-- TOC entry 4745 (class 2604 OID 794401)
-- Name: categories category_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories ALTER COLUMN category_id SET DEFAULT nextval('public.categories_category_id_seq'::regclass);


--
-- TOC entry 4731 (class 2604 OID 786245)
-- Name: order_statuses status_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_statuses ALTER COLUMN status_id SET DEFAULT nextval('public.order_statuses_status_id_seq'::regclass);


--
-- TOC entry 4730 (class 2604 OID 786236)
-- Name: user_roles role_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_roles ALTER COLUMN role_id SET DEFAULT nextval('public.user_roles_role_id_seq'::regclass);


--
-- TOC entry 4933 (class 0 OID 786316)
-- Dependencies: 224
-- Data for Name: action_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.action_logs (log_id, user_id, action_type, details, "timestamp") FROM stdin;
83645748-cf76-4721-bbfc-45af4ff50275	aefe9654-928c-4afb-af5d-a0fba3022fd6	USER_REGISTERED	{"email": "fredmbugua320@gmail.com", "roleId": 3, "registrationMethod": "web"}	2025-10-21 08:20:15.207847
fda34df1-66f1-4ebf-8558-53ab61c45446	aefe9654-928c-4afb-af5d-a0fba3022fd6	USER_LOGIN	{"email": "fredmbugua320@gmail.com"}	2025-10-21 08:20:53.069478
c56104a6-07d8-4407-911f-7d03780b25f0	aefe9654-928c-4afb-af5d-a0fba3022fd6	USER_LOGIN	{"email": "fredmbugua320@gmail.com"}	2025-10-21 08:30:03.682597
18268f03-f8cb-4377-9d9a-83aa3214dda0	aefe9654-928c-4afb-af5d-a0fba3022fd6	USER_LOGIN	{"email": "fredmbugua320@gmail.com"}	2025-10-21 08:33:03.434687
86ee8486-48a3-4f89-a882-05b97fd75884	beeeee1d-50d1-4e5c-8b32-b664c57b6775	USER_REGISTERED	{"email": "mbuguafredrick645@gmail.com", "roleId": 3, "registrationMethod": "web"}	2025-10-22 07:56:27.96029
93a6b481-b675-4e8c-8fd6-01b2a8300a67	beeeee1d-50d1-4e5c-8b32-b664c57b6775	USER_LOGIN	{"email": "mbuguafredrick645@gmail.com"}	2025-10-22 07:56:50.382068
0dc1f592-96c2-45da-a25c-f7fefdbe99b9	beeeee1d-50d1-4e5c-8b32-b664c57b6775	USER_LOGIN	{"email": "mbuguafredrick645@gmail.com"}	2025-10-22 12:52:40.089795
e6e938cf-3e9b-4a85-b194-813f52c89b6e	beeeee1d-50d1-4e5c-8b32-b664c57b6775	USER_LOGIN	{"email": "mbuguafredrick645@gmail.com"}	2025-10-22 12:56:26.23381
\.


--
-- TOC entry 4930 (class 0 OID 786267)
-- Dependencies: 221
-- Data for Name: books; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.books (book_id, title, author, isbn, description, price, stock_quantity, image_url, is_active, created_at, updated_at, category_id) FROM stdin;
b0000000-0000-4000-8000-000000000001	The TypeScript Handbook	Microsoft	978-0123456789	A comprehensive guide to modern TypeScript development, covering all features up to the latest stable version.	3500.00	50	/images/BOOKS/spark-cre-grade-8-cover-1753255540.jpg	t	2025-10-21 10:43:41.047767	2025-10-21 10:43:41.047767	3
b0000000-0000-4000-8000-000000000002	Node.js in Action	Major Developers	978-9876543210	Practical examples and deep dives into asynchronous programming, streams, and performance optimization in Node.js.	2850.50	120	/images/BOOKS/spark-cre-grade-8-cover-1753255540.jpg	t	2025-10-21 10:43:41.047767	2025-10-21 10:43:41.047767	3
b0000000-0000-4000-8000-000000000003	SQL and PostgreSQL Mastery	Data Enthusiast	978-1111222233	Mastering advanced SQL techniques and PostgreSQL-specific features like JSONB and stored procedures.	4100.00	5	/images/BOOKS/spark-cre-grade-8-cover-1753255540.jpg	t	2025-10-21 10:43:41.047767	2025-10-21 10:43:41.047767	3
b0000000-0000-4000-8000-000000000004	The Secret History of the World	Hidden Author	978-4444555566	A rare, out-of-print book that is currently inactive in the catalog.	9999.99	1	/images/BOOKS/spark-cre-grade-8-cover-1753255540.jpg	f	2025-10-21 10:43:41.047767	2025-10-21 10:43:41.047767	3
\.


--
-- TOC entry 4935 (class 0 OID 794398)
-- Dependencies: 226
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.categories (category_id, category_name, created_at, updated_at) FROM stdin;
1	Fiction	2025-10-22 19:01:00.092165+03	2025-10-22 19:01:00.092165+03
2	Technology	2025-10-22 19:01:00.092165+03	2025-10-22 19:01:00.092165+03
3	Science	2025-10-22 19:01:00.092165+03	2025-10-22 19:01:00.092165+03
4	History	2025-10-22 19:01:00.092165+03	2025-10-22 19:01:00.092165+03
5	Business	2025-10-22 19:01:00.092165+03	2025-10-22 19:01:00.092165+03
6	Self-Help	2025-10-22 19:01:00.092165+03	2025-10-22 19:01:00.092165+03
\.


--
-- TOC entry 4932 (class 0 OID 786300)
-- Dependencies: 223
-- Data for Name: order_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.order_items (item_id, order_id, book_id, quantity, price_at_purchase) FROM stdin;
\.


--
-- TOC entry 4928 (class 0 OID 786242)
-- Dependencies: 219
-- Data for Name: order_statuses; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.order_statuses (status_id, status_name) FROM stdin;
1	pending
2	processing
3	shipped
4	delivered
5	cancelled
\.


--
-- TOC entry 4931 (class 0 OID 786281)
-- Dependencies: 222
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.orders (order_id, user_id, guest_email, guest_name, guest_phone, shipping_address, total_amount, status_id, order_date) FROM stdin;
\.


--
-- TOC entry 4926 (class 0 OID 786233)
-- Dependencies: 217
-- Data for Name: user_roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_roles (role_id, role_name) FROM stdin;
1	admin
2	shop_keeper
3	customer
\.


--
-- TOC entry 4929 (class 0 OID 786250)
-- Dependencies: 220
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (user_id, email, password_hash, first_name, last_name, phone_number, role_id, created_at, updated_at) FROM stdin;
aefe9654-928c-4afb-af5d-a0fba3022fd6	fredmbugua320@gmail.com	$2b$10$2vl4wfqj/9TM28YNMtRCFuvjmrkw8G9G3UX4tkpP4pzIUblIM1Gyu	Fredrick	Mbugua	\N	3	2025-10-21 08:20:15.141787	2025-10-21 08:20:15.141787
beeeee1d-50d1-4e5c-8b32-b664c57b6775	mbuguafredrick645@gmail.com	$2b$10$XJwblDLCJL40Vxntn8rlFOA8dQbNpIwTbz7Qw1hDOpiO37FgK1W2e	Fredrick	Mbugua	\N	3	2025-10-22 07:56:27.502311	2025-10-22 07:56:27.502311
\.


--
-- TOC entry 4945 (class 0 OID 0)
-- Dependencies: 225
-- Name: categories_category_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.categories_category_id_seq', 6, true);


--
-- TOC entry 4946 (class 0 OID 0)
-- Dependencies: 218
-- Name: order_statuses_status_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.order_statuses_status_id_seq', 5, true);


--
-- TOC entry 4947 (class 0 OID 0)
-- Dependencies: 216
-- Name: user_roles_role_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.user_roles_role_id_seq', 3, true);


--
-- TOC entry 4770 (class 2606 OID 786324)
-- Name: action_logs action_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.action_logs
    ADD CONSTRAINT action_logs_pkey PRIMARY KEY (log_id);


--
-- TOC entry 4761 (class 2606 OID 786280)
-- Name: books books_isbn_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.books
    ADD CONSTRAINT books_isbn_key UNIQUE (isbn);


--
-- TOC entry 4763 (class 2606 OID 786278)
-- Name: books books_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.books
    ADD CONSTRAINT books_pkey PRIMARY KEY (book_id);


--
-- TOC entry 4772 (class 2606 OID 794407)
-- Name: categories categories_category_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_category_name_key UNIQUE (category_name);


--
-- TOC entry 4774 (class 2606 OID 794405)
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (category_id);


--
-- TOC entry 4768 (class 2606 OID 786305)
-- Name: order_items order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_pkey PRIMARY KEY (item_id);


--
-- TOC entry 4753 (class 2606 OID 786247)
-- Name: order_statuses order_statuses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_statuses
    ADD CONSTRAINT order_statuses_pkey PRIMARY KEY (status_id);


--
-- TOC entry 4755 (class 2606 OID 786249)
-- Name: order_statuses order_statuses_status_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_statuses
    ADD CONSTRAINT order_statuses_status_name_key UNIQUE (status_name);


--
-- TOC entry 4766 (class 2606 OID 786289)
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (order_id);


--
-- TOC entry 4749 (class 2606 OID 786238)
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (role_id);


--
-- TOC entry 4751 (class 2606 OID 786240)
-- Name: user_roles user_roles_role_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_role_name_key UNIQUE (role_name);


--
-- TOC entry 4757 (class 2606 OID 786261)
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- TOC entry 4759 (class 2606 OID 786259)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (user_id);


--
-- TOC entry 4764 (class 1259 OID 794413)
-- Name: idx_book_category; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_book_category ON public.books USING btree (category_id);


--
-- TOC entry 4779 (class 2606 OID 786311)
-- Name: order_items fk_book; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT fk_book FOREIGN KEY (book_id) REFERENCES public.books(book_id);


--
-- TOC entry 4776 (class 2606 OID 794408)
-- Name: books fk_book_category; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.books
    ADD CONSTRAINT fk_book_category FOREIGN KEY (category_id) REFERENCES public.categories(category_id) ON DELETE SET NULL;


--
-- TOC entry 4780 (class 2606 OID 786306)
-- Name: order_items fk_order; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT fk_order FOREIGN KEY (order_id) REFERENCES public.orders(order_id);


--
-- TOC entry 4775 (class 2606 OID 786262)
-- Name: users fk_role; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT fk_role FOREIGN KEY (role_id) REFERENCES public.user_roles(role_id);


--
-- TOC entry 4777 (class 2606 OID 786295)
-- Name: orders fk_status; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT fk_status FOREIGN KEY (status_id) REFERENCES public.order_statuses(status_id);


--
-- TOC entry 4778 (class 2606 OID 786290)
-- Name: orders fk_user; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES public.users(user_id);


--
-- TOC entry 4781 (class 2606 OID 786325)
-- Name: action_logs fk_user_action; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.action_logs
    ADD CONSTRAINT fk_user_action FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE SET NULL;


-- Completed on 2025-10-22 19:55:04

--
-- PostgreSQL database dump complete
--

