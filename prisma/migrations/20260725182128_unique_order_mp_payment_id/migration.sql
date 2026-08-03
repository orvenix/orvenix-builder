ALTER TABLE `orders`
ADD UNIQUE INDEX `orders_mpPaymentId_key` (`mpPaymentId`);
