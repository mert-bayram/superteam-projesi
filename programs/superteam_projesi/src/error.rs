use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorCode {
    #[msg("Only the counter authority can update this counter")]
    Unauthorized,
    #[msg("Counter has reached the maximum value")]
    CounterOverflow,
    #[msg("Tip amount must be greater than zero")]
    ZeroAmount,
    #[msg("Message must be at most 140 bytes")]
    MessageTooLong,
    #[msg("Donors cannot tip themselves")]
    SelfTip,
}
