import { Input } from "@/components/ui/input";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

type Props = {
	id?: string;
	outerState: number;
	setOuterState: (value: number) => void;
	disabled: boolean;
	rejectNegative?: boolean;
	defaultValue?: number;
	className?: string;
	/** increment this prop to force the input to reset to `outerState` */
	resetFlag?: number;
	/** true => integer-only mode (切り捨て)、false => float mode */
	integer?: boolean;
	min?: number;
	max?: number;
};

const NumericInput: React.FC<Props> = ({
	outerState,
	setOuterState,
	disabled,
	rejectNegative = false,
	defaultValue = 0,
	id,
	className,
	integer = false,
	min,
	max,
	resetFlag,
}) => {
	const [rawValue, setRawValue] = useState<string>(outerState.toString());

	useEffect(() => {
		setRawValue(outerState.toString());
		// reference resetFlag so linter knows it's used to trigger resets
		// (value itself isn't needed inside effect)
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		resetFlag;
	}, [outerState, resetFlag]);

	const handleBlur = useCallback(() => {
		const parsed = Number.parseFloat(rawValue);
		if (Number.isNaN(parsed)) {
			toast.error("有効な数値を入力してください");
			setRawValue(defaultValue.toString());
			setOuterState(defaultValue);
			return;
		}

		let newValue: number;
		if (integer) {
			// integer mode: 切り捨て (小数部を取り除く)。負の数は 0 に近づく方向に切り捨て (Math.trunc)
			newValue = Math.trunc(parsed);
		} else {
			newValue = parsed;
		}

		// 範囲チェック: min / max が指定されていればクランプしてエラー表示
		if (typeof min === "number" && newValue < min) {
			toast.error(`値は ${min} 以上である必要があります`);
			setRawValue(min.toString());
			setOuterState(min);
			return;
		}
		if (typeof max === "number" && newValue > max) {
			toast.error(`値は ${max} 以下である必要があります`);
			setRawValue(max.toString());
			setOuterState(max);
			return;
		}

		if (rejectNegative && newValue < 0) {
			toast.error("負の数は入力できません");
			setRawValue(defaultValue.toString());
			setOuterState(defaultValue);
			return;
		}

		setRawValue(newValue.toString());
		setOuterState(newValue);
	}, [
		rawValue,
		rejectNegative,
		setOuterState,
		defaultValue,
		integer,
		min,
		max,
	]);

	return (
		<Input
			id={id}
			onBlur={handleBlur}
			onChange={(e) => {
				const v = e.target.value;
				if (integer) {
					// allow only optional leading '-' (if negatives allowed) and digits
					const intPattern = rejectNegative ? /^\d*$/ : /^-?\d*$/;
					if (intPattern.test(v)) setRawValue(v);
				} else {
					setRawValue(v);
				}
			}}
			type="number"
			step={integer ? 1 : undefined}
			inputMode={integer ? "numeric" : "decimal"}
			value={rawValue}
			onKeyDown={(e) => {
				const key = e.code;
				if (key === "Enter") {
					e.currentTarget.blur();
					e.preventDefault();
					e.stopPropagation();
				}

				if (integer) {
					// Prevent decimal/input of '.' and scientific 'e'
					if (
						key === "NumpadDecimal" ||
						key === "Period" ||
						key === "Comma" ||
						key === "KeyE"
					) {
						e.preventDefault();
					}
					// Prevent minus if negatives are rejected
					if (rejectNegative && (key === "Minus" || key === "NumpadSubtract")) {
						e.preventDefault();
					}
				}
			}}
			onPaste={(e) => {
				if (integer) {
					const text = e.clipboardData?.getData("text") ?? "";
					const sanitized = (
						rejectNegative
							? text.replace(/[^0-9]/g, "")
							: text.replace(/[^0-9\-]/g, "")
					).replace(/(?!^)-/g, "");
					if (/^-?\d+$/.test(sanitized)) {
						setRawValue(sanitized);
					} else {
						// if nothing valid, prevent paste
						e.preventDefault();
					}
				}
			}}
			disabled={disabled}
			className={className}
		/>
	);
};

export default NumericInput;
