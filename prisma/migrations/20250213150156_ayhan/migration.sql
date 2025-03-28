-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'USER', 'GUEST', 'MUSTERI_SEVIYE1', 'MUSTERI_SEVIYE2', 'HIZMETSAGLAYICI_SEVIYE1', 'HIZMETSAGLAYICI_SEVIYE2');

-- CreateEnum
CREATE TYPE "UserSex" AS ENUM ('Erkek', 'Kadin', 'Diger');

-- CreateEnum
CREATE TYPE "UserBloodType" AS ENUM ('ARhP', 'ARhN', 'BRhP', 'BRhN', 'ABRhP', 'ABRhN', 'ORhP', 'ORhN');

-- CreateEnum
CREATE TYPE "DeviceStatus" AS ENUM ('Aktif', 'Pasif');

-- CreateEnum
CREATE TYPE "OfferStatus" AS ENUM ('Onaylandi', 'Red', 'Beklemede');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('Aktif', 'Pasif', 'Beklemede', 'Iptal', 'TeklifAlindi', 'Tamamlandi');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('Okundu', 'Okunmadi');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "password" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'GUEST',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "bloodType" "UserBloodType",
    "birthday" TIMESTAMP(3),
    "sex" "UserSex",
    "photo" TEXT,
    "phone" TEXT,
    "registrationDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "institutionId" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("provider","providerAccountId")
);

-- CreateTable
CREATE TABLE "Session" (
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "EmailVerificationToken" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailVerificationToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VerificationToken_pkey" PRIMARY KEY ("identifier","token")
);

-- CreateTable
CREATE TABLE "Authenticator" (
    "credentialID" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "credentialPublicKey" TEXT NOT NULL,
    "counter" INTEGER NOT NULL,
    "credentialDeviceType" TEXT NOT NULL,
    "credentialBackedUp" BOOLEAN NOT NULL,
    "transports" TEXT,

    CONSTRAINT "Authenticator_pkey" PRIMARY KEY ("userId","credentialID")
);

-- CreateTable
CREATE TABLE "Institutions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "registrationDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Institutions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Devices" (
    "id" TEXT NOT NULL,
    "serialNumber" TEXT NOT NULL,
    "qrcode" TEXT NOT NULL,
    "productionDate" TIMESTAMP(3) NOT NULL,
    "lastControlDate" TIMESTAMP(3) NOT NULL,
    "expirationDate" TIMESTAMP(3) NOT NULL,
    "nextControlDate" TIMESTAMP(3) NOT NULL,
    "location" TEXT NOT NULL,
    "location1" TEXT NOT NULL,
    "photo" TEXT,
    "currentStatus" "DeviceStatus" NOT NULL,
    "typeId" TEXT NOT NULL,
    "featureId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "ownerInstId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "providerInstId" TEXT NOT NULL,
    "isgMemberId" TEXT NOT NULL,
    "details" TEXT NOT NULL,

    CONSTRAINT "Devices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IsgMembers" (
    "id" TEXT NOT NULL,
    "isgNumber" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contractDate" TIMESTAMP(3) NOT NULL,
    "institutionId" TEXT NOT NULL,

    CONSTRAINT "IsgMembers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeviceTypes" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "DeviceTypes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeviceFeatures" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "deviceTypeId" TEXT NOT NULL,

    CONSTRAINT "DeviceFeatures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaintenanceCards" (
    "id" TEXT NOT NULL,
    "maintenanceDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nextMaintenanceDate" TIMESTAMP(3) NOT NULL,
    "deviceId" TEXT NOT NULL,
    "deviceTypeId" TEXT NOT NULL,
    "deviceFeatureId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "providerInsId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "customerInsId" TEXT NOT NULL,
    "details" TEXT,

    CONSTRAINT "MaintenanceCards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaintenanceSub" (
    "id" TEXT NOT NULL,
    "maintenanceCardId" TEXT NOT NULL,
    "operationId" TEXT NOT NULL,
    "detail" TEXT,

    CONSTRAINT "MaintenanceSub_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Operations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "deviceTypeId" TEXT NOT NULL,

    CONSTRAINT "Operations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OfferCards" (
    "id" TEXT NOT NULL,
    "offerDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validityDate" TIMESTAMP(3) NOT NULL,
    "paymentTermId" TEXT NOT NULL,
    "status" "OfferStatus" NOT NULL,
    "creatorId" TEXT NOT NULL,
    "creatorInsId" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "recipientInsId" TEXT NOT NULL,
    "requestId" TEXT,
    "details" TEXT NOT NULL,

    CONSTRAINT "OfferCards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OfferSub" (
    "id" TEXT NOT NULL,
    "offerCardId" TEXT NOT NULL,
    "servideId" TEXT NOT NULL,
    "unitPrice" DECIMAL(65,30) NOT NULL,
    "size" DECIMAL(65,30) NOT NULL,
    "detail" TEXT,

    CONSTRAINT "OfferSub_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OfferRequests" (
    "id" TEXT NOT NULL,
    "start" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "end" TIMESTAMP(3) NOT NULL,
    "status" "RequestStatus" NOT NULL,
    "creatorId" TEXT NOT NULL,
    "creatorInsId" TEXT NOT NULL,
    "details" TEXT NOT NULL,

    CONSTRAINT "OfferRequests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RequestSub" (
    "id" TEXT NOT NULL,
    "requiredDate" TIMESTAMP(3) NOT NULL,
    "offerRequestId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "quantity" DECIMAL(65,30) NOT NULL,
    "detail" TEXT,

    CONSTRAINT "RequestSub_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Services" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentTermTypes" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "PaymentTermTypes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notifications" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "creatorInsId" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "recipientInsId" TEXT NOT NULL,
    "notificationDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isRead" "NotificationStatus" NOT NULL,
    "typeId" TEXT NOT NULL,
    "deviceId" TEXT,
    "deviceTypeId" TEXT,

    CONSTRAINT "Notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationTypes" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "NotificationTypes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Appointments" (
    "id" TEXT NOT NULL,
    "tittle" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "start" TIMESTAMP(3) NOT NULL,
    "end" TIMESTAMP(3) NOT NULL,
    "create" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creatorId" TEXT NOT NULL,
    "creatorInsId" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "recipientInsId" TEXT NOT NULL,

    CONSTRAINT "Appointments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Logs" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "actionId" TEXT NOT NULL,
    "tableId" TEXT NOT NULL,
    "IP" TEXT NOT NULL,

    CONSTRAINT "Logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Actions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tables" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Tables_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Announcements" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "creatorId" TEXT NOT NULL,
    "creatorInsId" TEXT NOT NULL,

    CONSTRAINT "Announcements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Teams" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamsMembers" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "bloodType" "UserBloodType" NOT NULL,
    "birthday" TIMESTAMP(3) NOT NULL,
    "sex" "UserSex" NOT NULL,
    "photo" TEXT,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "registrationDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "institutionId" INTEGER NOT NULL,

    CONSTRAINT "TeamsMembers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_TeamsToTeamsMembers" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "EmailVerificationToken_token_key" ON "EmailVerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "EmailVerificationToken_email_token_key" ON "EmailVerificationToken"("email", "token");

-- CreateIndex
CREATE UNIQUE INDEX "Authenticator_credentialID_key" ON "Authenticator"("credentialID");

-- CreateIndex
CREATE UNIQUE INDEX "Devices_serialNumber_key" ON "Devices"("serialNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Devices_qrcode_key" ON "Devices"("qrcode");

-- CreateIndex
CREATE UNIQUE INDEX "_TeamsToTeamsMembers_AB_unique" ON "_TeamsToTeamsMembers"("A", "B");

-- CreateIndex
CREATE INDEX "_TeamsToTeamsMembers_B_index" ON "_TeamsToTeamsMembers"("B");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institutions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Authenticator" ADD CONSTRAINT "Authenticator_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Devices" ADD CONSTRAINT "Devices_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "DeviceTypes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Devices" ADD CONSTRAINT "Devices_featureId_fkey" FOREIGN KEY ("featureId") REFERENCES "DeviceFeatures"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Devices" ADD CONSTRAINT "Devices_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Devices" ADD CONSTRAINT "Devices_ownerInstId_fkey" FOREIGN KEY ("ownerInstId") REFERENCES "Institutions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Devices" ADD CONSTRAINT "Devices_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Devices" ADD CONSTRAINT "Devices_providerInstId_fkey" FOREIGN KEY ("providerInstId") REFERENCES "Institutions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Devices" ADD CONSTRAINT "Devices_isgMemberId_fkey" FOREIGN KEY ("isgMemberId") REFERENCES "IsgMembers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IsgMembers" ADD CONSTRAINT "IsgMembers_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institutions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeviceFeatures" ADD CONSTRAINT "DeviceFeatures_deviceTypeId_fkey" FOREIGN KEY ("deviceTypeId") REFERENCES "DeviceTypes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceCards" ADD CONSTRAINT "MaintenanceCards_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Devices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceCards" ADD CONSTRAINT "MaintenanceCards_deviceTypeId_fkey" FOREIGN KEY ("deviceTypeId") REFERENCES "DeviceTypes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceCards" ADD CONSTRAINT "MaintenanceCards_deviceFeatureId_fkey" FOREIGN KEY ("deviceFeatureId") REFERENCES "DeviceFeatures"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceCards" ADD CONSTRAINT "MaintenanceCards_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceCards" ADD CONSTRAINT "MaintenanceCards_providerInsId_fkey" FOREIGN KEY ("providerInsId") REFERENCES "Institutions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceCards" ADD CONSTRAINT "MaintenanceCards_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceCards" ADD CONSTRAINT "MaintenanceCards_customerInsId_fkey" FOREIGN KEY ("customerInsId") REFERENCES "Institutions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceSub" ADD CONSTRAINT "MaintenanceSub_maintenanceCardId_fkey" FOREIGN KEY ("maintenanceCardId") REFERENCES "MaintenanceCards"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceSub" ADD CONSTRAINT "MaintenanceSub_operationId_fkey" FOREIGN KEY ("operationId") REFERENCES "Operations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Operations" ADD CONSTRAINT "Operations_deviceTypeId_fkey" FOREIGN KEY ("deviceTypeId") REFERENCES "DeviceTypes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfferCards" ADD CONSTRAINT "OfferCards_paymentTermId_fkey" FOREIGN KEY ("paymentTermId") REFERENCES "PaymentTermTypes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfferCards" ADD CONSTRAINT "OfferCards_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfferCards" ADD CONSTRAINT "OfferCards_creatorInsId_fkey" FOREIGN KEY ("creatorInsId") REFERENCES "Institutions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfferCards" ADD CONSTRAINT "OfferCards_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfferCards" ADD CONSTRAINT "OfferCards_recipientInsId_fkey" FOREIGN KEY ("recipientInsId") REFERENCES "Institutions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfferCards" ADD CONSTRAINT "OfferCards_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "OfferRequests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfferSub" ADD CONSTRAINT "OfferSub_offerCardId_fkey" FOREIGN KEY ("offerCardId") REFERENCES "OfferCards"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfferSub" ADD CONSTRAINT "OfferSub_servideId_fkey" FOREIGN KEY ("servideId") REFERENCES "Services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfferRequests" ADD CONSTRAINT "OfferRequests_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfferRequests" ADD CONSTRAINT "OfferRequests_creatorInsId_fkey" FOREIGN KEY ("creatorInsId") REFERENCES "Institutions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestSub" ADD CONSTRAINT "RequestSub_offerRequestId_fkey" FOREIGN KEY ("offerRequestId") REFERENCES "OfferRequests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestSub" ADD CONSTRAINT "RequestSub_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notifications" ADD CONSTRAINT "Notifications_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notifications" ADD CONSTRAINT "Notifications_creatorInsId_fkey" FOREIGN KEY ("creatorInsId") REFERENCES "Institutions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notifications" ADD CONSTRAINT "Notifications_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notifications" ADD CONSTRAINT "Notifications_recipientInsId_fkey" FOREIGN KEY ("recipientInsId") REFERENCES "Institutions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notifications" ADD CONSTRAINT "Notifications_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "NotificationTypes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notifications" ADD CONSTRAINT "Notifications_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Devices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notifications" ADD CONSTRAINT "Notifications_deviceTypeId_fkey" FOREIGN KEY ("deviceTypeId") REFERENCES "DeviceTypes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointments" ADD CONSTRAINT "Appointments_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointments" ADD CONSTRAINT "Appointments_creatorInsId_fkey" FOREIGN KEY ("creatorInsId") REFERENCES "Institutions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointments" ADD CONSTRAINT "Appointments_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointments" ADD CONSTRAINT "Appointments_recipientInsId_fkey" FOREIGN KEY ("recipientInsId") REFERENCES "Institutions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Logs" ADD CONSTRAINT "Logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Logs" ADD CONSTRAINT "Logs_actionId_fkey" FOREIGN KEY ("actionId") REFERENCES "Actions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Logs" ADD CONSTRAINT "Logs_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "Tables"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Announcements" ADD CONSTRAINT "Announcements_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Announcements" ADD CONSTRAINT "Announcements_creatorInsId_fkey" FOREIGN KEY ("creatorInsId") REFERENCES "Institutions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TeamsToTeamsMembers" ADD CONSTRAINT "_TeamsToTeamsMembers_A_fkey" FOREIGN KEY ("A") REFERENCES "Teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TeamsToTeamsMembers" ADD CONSTRAINT "_TeamsToTeamsMembers_B_fkey" FOREIGN KEY ("B") REFERENCES "TeamsMembers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
