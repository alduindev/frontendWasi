import Modal from "../../../components/molecules/Modal";
import DynamicForm from "../../../forms/engine/DynamicForm";
import roomTemplate from "../../../forms/templates/hospitality/room.template";
import { createRoom, updateRoom } from "../../../services/hospitalityService";
export default function RoomFormModal({ item, onClose, onSaved }) {
  return (
    <Modal
      onClose={onClose}
      title={item ? "Editar habitación" : "Nueva habitación"}
    >
      <DynamicForm
        initialValues={item || {}}
        onCancel={onClose}
        onSubmit={async (values) => {
          if (item) await updateRoom(item.id, values);
          else await createRoom(values);
          onSaved();
        }}
        submitLabel={item ? "Guardar cambios" : "Crear habitación"}
        template={roomTemplate}
      />
    </Modal>
  );
}
