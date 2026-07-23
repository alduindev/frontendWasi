import Modal from "../../../components/molecules/Modal";
import DynamicForm from "../../../forms/engine/DynamicForm";
import guestTemplate from "../../../forms/templates/hospitality/guest.template";
import { createGuest, updateGuest } from "../../../services/hospitalityService";
export default function GuestFormModal({ item, onClose, onSaved }) {
  return (
    <Modal
      onClose={onClose}
      title={item ? "Editar huésped" : "Registrar huésped"}
    >
      <DynamicForm
        initialValues={item || {}}
        onCancel={onClose}
        onSubmit={async (values) => {
          const saved = item
            ? await updateGuest(item.id, values)
            : await createGuest(values);
          onSaved(saved);
        }}
        submitLabel={item ? "Guardar cambios" : "Registrar huésped"}
        template={guestTemplate}
      />
    </Modal>
  );
}
