/*
  Warnings:

  - Added the required column `soilHumidity` to the `SensorData` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `SensorData` ADD COLUMN `soilHumidity` DOUBLE NOT NULL;
