abstract class QueryPromise<T> implements Promise<T> {
	[Symbol.toStringTag] = "QueryPromise";

	public catch<TResult = never>(
		onRejected?: ((reason: unknown) => TResult | PromiseLike<TResult>) | null | undefined,
	): Promise<T | TResult> {
		return this.then(undefined, onRejected);
	}

	public finally(onFinally?: (() => void) | null | undefined): Promise<T> {
		return this.then(
			(value) => {
				onFinally?.();
				return value;
			},
			(reason) => {
				onFinally?.();
				throw reason;
			},
		);
	}

	// biome-ignore lint/suspicious/noThenProperty: <explanation>
	public then<TResult1 = T, TResult2 = never>(
		onFulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null,
		onRejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | undefined | null,
	): Promise<TResult1 | TResult2> {
		return this.execute().then(onFulfilled, onRejected);
	}

	public abstract execute(): Promise<T>;
}

export default QueryPromise;
