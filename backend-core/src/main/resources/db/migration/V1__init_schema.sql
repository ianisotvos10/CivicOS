--
-- PostgreSQL database dump
--

\restrict MlJpeklaRDFekcYhhkrz8FhyxyYbglLCbvyweiewkvtiPJSnLXs5TuezAzQlGrg

-- Dumped from database version 16.15 (Ubuntu 16.15-0ubuntu0.24.04.1)
-- Dumped by pg_dump version 16.15 (Ubuntu 16.15-0ubuntu0.24.04.1)

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: appointments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.appointments (
    id uuid NOT NULL,
    appointment_date character varying(10) NOT NULL,
    citizen_cnp character varying(13) NOT NULL,
    citizen_name character varying(150) NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    purpose character varying(300),
    status character varying(20) NOT NULL,
    time_slot character varying(10) NOT NULL,
    updated_at timestamp(6) without time zone
);


--
-- Name: citizen_profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.citizen_profiles (
    id uuid NOT NULL,
    adresa text,
    cnp character varying(13) NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    data_expirare character varying(255),
    email character varying(100),
    numar character varying(6),
    nume character varying(255) NOT NULL,
    prenume character varying(255) NOT NULL,
    serie character varying(2),
    telefon character varying(100),
    updated_at timestamp(6) without time zone NOT NULL
);


--
-- Name: city_alerts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.city_alerts (
    id uuid NOT NULL,
    active boolean NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    description character varying(1000) NOT NULL,
    latitude double precision NOT NULL,
    longitude double precision NOT NULL,
    title character varying(255) NOT NULL,
    type character varying(255) NOT NULL,
    updated_at timestamp(6) without time zone
);


--
-- Name: official_documents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.official_documents (
    id uuid NOT NULL,
    citizen_cnp character varying(255) NOT NULL,
    citizen_name character varying(255) NOT NULL,
    document_type character varying(255) NOT NULL,
    issued_at timestamp(6) without time zone,
    requested_at timestamp(6) without time zone NOT NULL,
    status character varying(255) NOT NULL,
    purpose character varying(255),
    qr_verification_code character varying(255),
    registration_number character varying(255),
    valid_until date,
    updated_at timestamp(6) without time zone,
    created_at timestamp(6) without time zone
);


--
-- Name: poll_options; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.poll_options (
    poll_id uuid NOT NULL,
    option_text character varying(255)
);


--
-- Name: poll_votes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.poll_votes (
    id uuid NOT NULL,
    citizen_cnp character varying(13) NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    option_index integer NOT NULL,
    poll_id uuid NOT NULL,
    updated_at timestamp(6) without time zone
);


--
-- Name: polls; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.polls (
    id uuid NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    expires_at timestamp(6) without time zone,
    question text NOT NULL,
    status character varying(20) NOT NULL,
    updated_at timestamp(6) without time zone
);


--
-- Name: public_service_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.public_service_requests (
    id uuid NOT NULL,
    citizen_cnp character varying(13) NOT NULL,
    citizen_name character varying(255) NOT NULL,
    created_at timestamp(6) without time zone,
    details text,
    resolution_message text,
    resolved_at timestamp(6) without time zone,
    service_type character varying(50) NOT NULL,
    status character varying(50) NOT NULL,
    sub_type character varying(100),
    updated_at timestamp(6) without time zone
);


--
-- Name: request_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.request_events (
    id uuid NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    description text,
    event_type character varying(50) NOT NULL,
    request_id uuid NOT NULL,
    updated_at timestamp(6) without time zone
);


--
-- Name: requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.requests (
    id uuid NOT NULL,
    ai_category character varying(50),
    created_at timestamp(6) without time zone NOT NULL,
    description text NOT NULL,
    status character varying(20) NOT NULL,
    title character varying(150) NOT NULL,
    user_id uuid,
    ai_sentiment character varying(50),
    ai_urgency character varying(50),
    ai_department character varying(100),
    ai_location character varying(255),
    ai_summary character varying(500),
    citizen_email character varying(100),
    resolution_text character varying(1000),
    citizen_cnp character varying(13),
    citizen_name character varying(100),
    estimated_cost double precision,
    latitude double precision,
    longitude double precision,
    original_description text,
    original_language character varying(50),
    routed_contractor character varying(150),
    updated_at timestamp(6) without time zone,
    CONSTRAINT requests_status_check CHECK (((status)::text = ANY ((ARRAY['OPEN'::character varying, 'IN_PROGRESS'::character varying, 'RESOLVED'::character varying, 'REJECTED'::character varying])::text[])))
);


--
-- Name: taxes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.taxes (
    id uuid NOT NULL,
    amount double precision NOT NULL,
    citizen_cnp character varying(255) NOT NULL,
    due_date date NOT NULL,
    is_paid boolean NOT NULL,
    paid_at timestamp(6) without time zone,
    type character varying(255) NOT NULL,
    contestation text,
    contestation_response text,
    contestation_status character varying(255),
    discount_deadline date,
    issued_by character varying(255),
    issued_date date,
    process_number character varying(255),
    category character varying(255) DEFAULT 'TAXA'::character varying,
    updated_at timestamp(6) without time zone,
    created_at timestamp(6) without time zone
);


--
-- Name: tenants; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tenants (
    id uuid NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    domain character varying(100) NOT NULL,
    name character varying(100) NOT NULL,
    updated_at timestamp(6) without time zone
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id uuid NOT NULL,
    cnp character varying(13) NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    email character varying(150) NOT NULL,
    first_name character varying(50) NOT NULL,
    last_name character varying(50) NOT NULL,
    password_hash character varying(255) NOT NULL,
    tenant_id uuid NOT NULL,
    updated_at timestamp(6) without time zone
);


--
-- Name: appointments appointments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_pkey PRIMARY KEY (id);


--
-- Name: citizen_profiles citizen_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.citizen_profiles
    ADD CONSTRAINT citizen_profiles_pkey PRIMARY KEY (id);


--
-- Name: city_alerts city_alerts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.city_alerts
    ADD CONSTRAINT city_alerts_pkey PRIMARY KEY (id);


--
-- Name: official_documents official_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.official_documents
    ADD CONSTRAINT official_documents_pkey PRIMARY KEY (id);


--
-- Name: poll_votes poll_votes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.poll_votes
    ADD CONSTRAINT poll_votes_pkey PRIMARY KEY (id);


--
-- Name: polls polls_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.polls
    ADD CONSTRAINT polls_pkey PRIMARY KEY (id);


--
-- Name: public_service_requests public_service_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.public_service_requests
    ADD CONSTRAINT public_service_requests_pkey PRIMARY KEY (id);


--
-- Name: request_events request_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.request_events
    ADD CONSTRAINT request_events_pkey PRIMARY KEY (id);


--
-- Name: requests requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.requests
    ADD CONSTRAINT requests_pkey PRIMARY KEY (id);


--
-- Name: taxes taxes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.taxes
    ADD CONSTRAINT taxes_pkey PRIMARY KEY (id);


--
-- Name: tenants tenants_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenants
    ADD CONSTRAINT tenants_pkey PRIMARY KEY (id);


--
-- Name: users uk6dotkott2kjsp8vw4d0m25fb7; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT uk6dotkott2kjsp8vw4d0m25fb7 UNIQUE (email);


--
-- Name: tenants ukehgpgu3yilhiprwm3wbipxt43; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenants
    ADD CONSTRAINT ukehgpgu3yilhiprwm3wbipxt43 UNIQUE (domain);


--
-- Name: citizen_profiles ukhu8p1eoxv56a7xypesw3p64jt; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.citizen_profiles
    ADD CONSTRAINT ukhu8p1eoxv56a7xypesw3p64jt UNIQUE (cnp);


--
-- Name: poll_votes ukqfk2sywd60eeh5fqilki7kn87; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.poll_votes
    ADD CONSTRAINT ukqfk2sywd60eeh5fqilki7kn87 UNIQUE (poll_id, citizen_cnp);


--
-- Name: users ukqlduvbot0drgmmv5oe1lauix0; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT ukqlduvbot0drgmmv5oe1lauix0 UNIQUE (cnp);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: poll_options fk1baxdjoxricfu0grc0j6821f7; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.poll_options
    ADD CONSTRAINT fk1baxdjoxricfu0grc0j6821f7 FOREIGN KEY (poll_id) REFERENCES public.polls(id);


--
-- Name: users fk21hn1a5ja1tve7ae02fnn4cld; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT fk21hn1a5ja1tve7ae02fnn4cld FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: requests fk8usbpx9csc6opbjg1d7kvtf8c; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.requests
    ADD CONSTRAINT fk8usbpx9csc6opbjg1d7kvtf8c FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- PostgreSQL database dump complete
--

\unrestrict MlJpeklaRDFekcYhhkrz8FhyxyYbglLCbvyweiewkvtiPJSnLXs5TuezAzQlGrg

