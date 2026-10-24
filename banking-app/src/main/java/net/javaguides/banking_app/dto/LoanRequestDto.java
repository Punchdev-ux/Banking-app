package net.javaguides.banking_app.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class LoanRequestDto {
    @JsonProperty("loan_amount") // Forces precise property extraction mapping
    private double loanAmount;
}
