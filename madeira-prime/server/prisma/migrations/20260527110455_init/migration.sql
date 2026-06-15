-- CreateTable
CREATE TABLE `leads_proprietarios` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(255) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `telefone` VARCHAR(50) NOT NULL,
    `localizacao` VARCHAR(255) NOT NULL,
    `tipo_imovel` VARCHAR(100) NOT NULL,
    `num_quartos` INTEGER NOT NULL,
    `notas` TEXT NULL,
    `quartos_calc` INTEGER NOT NULL,
    `diaria_media` DECIMAL(10, 2) NOT NULL,
    `ocupacao_estimada` DECIMAL(5, 2) NOT NULL,
    `receita_bruta_estimada` DECIMAL(12, 2) NOT NULL,
    `lucro_liquido_estimado` DECIMAL(12, 2) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `leads_investidores` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(255) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `telefone` VARCHAR(50) NOT NULL,
    `capital_disponivel` VARCHAR(100) NOT NULL,
    `horizonte_investimento` VARCHAR(100) NOT NULL,
    `mercado_interesse` VARCHAR(100) NOT NULL,
    `notas` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `marcacoes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(255) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `telefone` VARCHAR(50) NOT NULL,
    `data_preferida` DATE NOT NULL,
    `hora_preferida` VARCHAR(10) NOT NULL,
    `tipo_cliente` VARCHAR(50) NOT NULL,
    `notas` TEXT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'pendente',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
