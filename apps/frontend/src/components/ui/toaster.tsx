import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { removeNotification } from '../../store/slices/uiSlice';

export function Toaster() {
  const notifications = useSelector((state: RootState) => state.ui.notifications);
  const dispatch = useDispatch();

  const handleRemove = (id: string) => {
    dispatch(removeNotification(id));
  };

  return (
    <div className="fixed top-4 right-4 z-[100] flex max-h-screen w-full max-w-sm flex-col space-y-2">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-4 shadow-lg transition-all ${
            notification.type === 'error'
              ? 'border-red-500 bg-red-50 text-red-900'
              : 'border-gray-200 bg-white text-gray-900'
          }`}
        >
          <div className="grid gap-1">
            <div className="text-sm font-semibold">{notification.title}</div>
            {notification.message && (
              <div className="text-sm opacity-90">{notification.message}</div>
            )}
          </div>
          <button
            onClick={() => handleRemove(notification.id)}
            className="absolute right-2 top-2 rounded-md p-1 text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
