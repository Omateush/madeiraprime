-- CreateEnum
CREATE TYPE "ProjetoFase" AS ENUM ('before', 'during', 'after');

-- CreateTable
CREATE TABLE "leads_proprietarios" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "telefone" VARCHAR(50) NOT NULL,
    "localizacao" VARCHAR(255) NOT NULL,
    "tipo_imovel" VARCHAR(100) NOT NULL,
    "num_quartos" INTEGER NOT NULL,
    "notas" TEXT,
    "quartos_calc" INTEGER NOT NULL,
    "diaria_media" DECIMAL(10,2) NOT NULL,
    "ocupacao_estimada" DECIMAL(5,2) NOT NULL,
    "receita_bruta_estimada" DECIMAL(12,2) NOT NULL,
    "lucro_liquido_estimado" DECIMAL(12,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "leads_proprietarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leads_investidores" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "telefone" VARCHAR(50) NOT NULL,
    "capital_disponivel" VARCHAR(100) NOT NULL,
    "horizonte_investimento" VARCHAR(100) NOT NULL,
    "mercado_interesse" VARCHAR(100) NOT NULL,
    "notas" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "leads_investidores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "imoveis" (
    "id" SERIAL NOT NULL,
    "titulo" VARCHAR(255) NOT NULL,
    "descricao" TEXT,
    "localizacao" VARCHAR(255) NOT NULL,
    "tipo" VARCHAR(100) NOT NULL,
    "num_quartos" INTEGER NOT NULL,
    "preco_por_noite" DECIMAL(10,2) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'disponivel',
    "ocupado_ate" DATE,
    "imagem_url" VARCHAR(500),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "imoveis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reservas" (
    "id" SERIAL NOT NULL,
    "imovel_id" INTEGER NOT NULL,
    "nome_hospede" VARCHAR(255) NOT NULL,
    "email_hospede" VARCHAR(255) NOT NULL,
    "telefone_hospede" VARCHAR(50) NOT NULL,
    "check_in" DATE NOT NULL,
    "check_out" DATE NOT NULL,
    "total_noites" INTEGER NOT NULL,
    "preco_por_noite" DECIMAL(10,2) NOT NULL,
    "total_amount" DECIMAL(12,2) NOT NULL,
    "status" VARCHAR(30) NOT NULL DEFAULT 'aguardar_pagamento',
    "stripe_session_id" VARCHAR(255),
    "pagamento_status" VARCHAR(30) NOT NULL DEFAULT 'aguardar_pagamento',
    "notas" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reservas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projetos_investimento" (
    "id" SERIAL NOT NULL,
    "titulo" VARCHAR(255) NOT NULL,
    "localizacao" VARCHAR(255) NOT NULL,
    "area_m2" INTEGER,
    "preco_compra" DECIMAL(12,2),
    "preco_venda" DECIMAL(12,2),
    "valorizacao" VARCHAR(20) NOT NULL,
    "status" VARCHAR(50) NOT NULL DEFAULT 'em_curso',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "projetos_investimento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projeto_imagens" (
    "id" SERIAL NOT NULL,
    "projeto_id" INTEGER NOT NULL,
    "url" VARCHAR(500) NOT NULL,
    "phase" "ProjetoFase" NOT NULL,
    "caption" VARCHAR(255),
    "date" VARCHAR(20),
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "projeto_imagens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marcacoes" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "telefone" VARCHAR(50) NOT NULL,
    "data_preferida" DATE NOT NULL,
    "hora_preferida" VARCHAR(10) NOT NULL,
    "tipo_cliente" VARCHAR(50) NOT NULL,
    "notas" TEXT,
    "status" VARCHAR(30) NOT NULL DEFAULT 'aguardar_pagamento',
    "stripe_session_id" VARCHAR(255),
    "pagamento_status" VARCHAR(30) NOT NULL DEFAULT 'aguardar_pagamento',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "marcacoes_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "reservas" ADD CONSTRAINT "reservas_imovel_id_fkey" FOREIGN KEY ("imovel_id") REFERENCES "imoveis"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projeto_imagens" ADD CONSTRAINT "projeto_imagens_projeto_id_fkey" FOREIGN KEY ("projeto_id") REFERENCES "projetos_investimento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
