package net.javaguides.banking_app.dto;

//
//import lombok.AllArgsConstructor;
//import lombok.Data;
//import lombok.NoArgsConstructor;
//
//@Data
//@NoArgsConstructor
//@AllArgsConstructor
//public class AccountDto {
//    private Long id;
//    private  String accountHolderName;
//    private double balance;
//
//    public AccountDto(long id, String accountHolderName, double balance) {
//    }
//}

public record AccountDto(Long id,
                         String accountHolderName,
                         double balance) {
}