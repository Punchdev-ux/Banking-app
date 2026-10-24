package net.javaguides.banking_app.exception;

public class AccountNotFoundException extends RuntimeException{

    public AccountNotFoundException(String messsage){
        super(messsage);
    }
}
