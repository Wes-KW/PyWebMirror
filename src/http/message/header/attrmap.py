from typing import Union, overload


class AttrMap:

	_itr: dict[str, str] # internal to reference map
	_rti: dict[str, str] # reference to internal map

	@overload
	def __init__(self, ref: list[str]) -> None:
		pass

	@overload
	def __init__(self, ref: dict[str, str]) -> None:
		pass

	def __init__(self, ref: Union[list[str], set[str], dict[str, str], None]) -> None:
		if isinstance(ref, list) or isinstance(ref, set) or isinstance(ref, dict):
			irm = {}
			if isinstance(ref, dict):
				irm = ref.copy()
			else:
				irm = {r.replace("-", "_").replace(" ", "_"): r for r in ref}
			self._itr = irm
			self._rti = {irm[k]: k for k in irm}
		else:
			self._itr = {}
			self._rti = {}

	def add(self, internal_attr: str, real_attr: str) -> None:
		self._itr[internal_attr] = real_attr
		self._rti[real_attr] = internal_attr

	@property
	def internal_attributes(self) -> set[str]:
		return set(self._itr.keys())

	@property
	def reference_attributes(self) -> set[str]:
		return set(self._rti.keys())

	def to_reference(self, internal: str) -> str:
		return self._itr[internal]

	def to_internal(self, reference: str) -> str:
		return self._rti[reference]
