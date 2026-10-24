package net.javaguides.banking_app.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class TransferRequestDto {
    @NotNull(message = "Sender ID is required")
    private Long senderAccountId;

    @NotNull(message = "Receiver ID is required")
    private Long receiverAccountId;

    @Min(value = 1, message = "Transfer amount must be greater than zero")
    private double amount;
}
