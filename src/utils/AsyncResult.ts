type Result<Sucess, Error> = { ok: true, value: Sucess } | { ok: false, error: Error };

export const Ok = <Sucess, Error>(value: Sucess): Result<Sucess, Error> => ({ ok: true, value });
export const Err = <Sucess, Error>(value: Error): Result<Sucess, Error> => ({ ok: false, error: value });

export type AsyncResult<Sucess, Error> = Promise<Result<Sucess, Error>>;