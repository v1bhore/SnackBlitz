import { Button, Image, Rate, Table, Collapse } from "antd";
import { addDoc, collection, getDocs, query, updateDoc, where } from "firebase/firestore";
import React, { useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { db } from "../../firebase/firebase";
import { getAuth } from "firebase/auth";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const { Panel } = Collapse;

const RestaurantDetails = () => {
  const user = getAuth().currentUser;
  const navigate = useNavigate();
  const [rating, setRating] = useState(0);
  const { id } = useParams();
  const [userData, setUserData] = useState(null);
  const [details, setDetails] = useState([]);
  const [showDetails, setShowDetails] = useState(false);
  const adminCollection = collection(db, "admin");
  const userCollection = collection(db, "user");

  const columns = [
    {
      title: "Item",
      dataIndex: "item",
      key: "item",
      render: (text) => <a>{text}</a>,
    },
    {
      title: "Description",
      dataIndex: "describe",
      key: "description",
    },
    {
      title: "Price",
      dataIndex: "price",
      key: "price",
    },
    {
      title: "Image",
      key: "image",
      dataIndex: "image",
      render: (imgd, d) => {
        return (
          <div className="flex align-middle justify-evenly">
            <Image src={imgd?.link} height={50} className="w-7 h-7" />
          </div>
        );
      },
    },
    {
      title: "Action",
      key: "action",
      dataIndex: "key",
      render: (k, record) => {
        return (
          <div className="flex justify-evenly">
            <Button
              className="bg-blue-300"
              type="secondary"
              onClick={() => {
                if (user?.email == null || user?.email == "") {
                  navigate("/login");
                  toast.error("Login First");
                  return;
                }
                removeFromCart(record);
              }}
            >
              -
            </Button>
            {getCount(record.key)}
            <Button
              className="bg-blue-300"
              type="secondary"
              onClick={() => {
                if (user?.email == null || user?.email == "") {
                  navigate("/login");
                  toast.error("Login First");
                  return;
                }
                addToCart(record);
              }}
            >
              +
            </Button>
          </div>
        );
      },
    },
  ];

  const getCount = (k) => {
    if (!user?.email) return 0;
    if (userData?.resId !== atob(id)) return 0;
    let result = 0;
    userData?.cart?.forEach((v) => {
      if (v.key === k) result = v.cnt;
    });
    return result;
  };

  const addToCart = async (rec) => {
    const q = query(userCollection, where("email", "==", user.email));
    const querySnapshot = await getDocs(q);

    querySnapshot.forEach(async (doc) => {
      const data = doc.data();
      let newData = data;
      if (!data?.resId) {
        newData.resId = atob(id);
        newData.resImg = details.resPicLink;
        newData.resName = details.name;
      } else {
        if (data.resId !== atob(id) || data?.resId === null) {
          newData.resId = atob(id);
          newData.resImg = details.resPicLink;
          newData.resName = details.name;
          newData.cart = [];
        }
      }
      let flag = true;
      let lis =
        newData?.cart?.map((v, i) => {
          if (v.key === rec.key) {
            flag = false;
            return { ...v, cnt: v?.cnt ? v.cnt + 1 : 1 };
          } else {
            return v;
          }
        }) || [];

      if (flag) {
        lis.push({ ...rec, cnt: 1 });
      }
      newData.cart = lis;
      await updateDoc(doc.ref, { ...newData });
      getUserData();
      toast.success("Added to Cart");
    });
  };

  const removeFromCart = async (rec) => {
    const q = query(userCollection, where("email", "==", user.email));
    const querySnapshot = await getDocs(q);

    querySnapshot.forEach(async (doc) => {
      const data = doc.data();

      if (!data?.resId) {
        return;
      } else {
        if (data.resId !== atob(id)) {
          return;
        }
      }
      let flag = false;
      let lis =
        data?.cart
          ?.map((v, i) => {
            if (v.key === rec.key) {
              if (v.cnt === 1) return;
              return { ...v, cnt: v?.cnt ? v.cnt - 1 : 1 };
            } else {
              return v;
            }
          })
          .filter((v) => v) || [];

      if (lis.length == 0) {
        await updateDoc(doc.ref, {
          ...data,
          cart: lis,
          resId: null,
          resImg: null,
          resName: null,
        });
      } else await updateDoc(doc.ref, { ...data, cart: lis });
      getUserData();
      toast.error("Removed from cart");
    });
  };

  async function getUserData() {
    if (user?.email == null) {
      return;
    }

    const q = query(userCollection, where("email", "==", user.email));
    const querySnapshot = await getDocs(q);
    const v = querySnapshot?.docs[0];

    const res = v.data();
    res?.rating?.forEach((v, i) => {
      if (v.key === atob(id)) setRating(v.rating);
    });
    setUserData(v.data());
  }

  async function getData() {
    setDetails(null);
    const q = query(adminCollection, where("email", "==", atob(id)));

    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      await addDoc(await adminCollection, {
        email: atob(id),
      });
      setDetails({ email: atob(id) });
    } else {
      querySnapshot.forEach(async (doc) => {
        setDetails(doc.data());
      });
    }
    return;
  }

  async function updateRating(rate) {
    if (user?.email == null || user?.email == "") {
      navigate("/login");
      toast.error("Login First");
      return;
    }
    const q = query(userCollection, where("email", "==", user.email));
    const querySnapshot = await getDocs(q);

    const v = querySnapshot?.docs[0];
    const res = v?.data();
    if (res == null) return;
    let flag = true;
    let oldRate = null;
    let lis =
      res?.rating?.filter((v) => {
        if (v.key === atob(id)) {
          oldRate = v.rating;
          return false;
        }
        return true;
      }) || [];

    {
      const q = query(adminCollection, where("email", "==", atob(id)));
      const querySnapshot = await getDocs(q);
      const doc = querySnapshot?.docs[0];
      if (oldRate === null)
        await updateDoc(doc.ref, {
          ...doc.data(),
          ratingCount: doc.data()?.ratingCount + 1 || 1,
          rating: doc.data()?.rating + rate || rate,
        });
      else
        await updateDoc(doc.ref, {
          ...doc.data(),
          rating: doc.data()?.rating + rate - oldRate,
        });
    }
    lis = [...lis, { key: atob(id), rating: rate }];
    await updateDoc(v.ref, { ...res, rating: lis });
    getData();
    getUserData();
  }

  React.useEffect(() => {
    getUserData();
    getData();
  }, []);

  const toggleDetails = () => {
    setShowDetails(!showDetails);
  };

  return (
    <div className="p-6">
      <ToastContainer />
      <div>
        <div className="bg-gray-100 p-4 rounded-lg shadow-md mb-6">
          <h1 className="font-bold text-2xl text-gray-800">
            Order from
            <span className="text-indigo-600">{" " + details?.name}</span>
          </h1>
        </div>
      </div>
      <div className="flex justify-between mb-4">
        <Button type="primary" onClick={toggleDetails} className="bg-blue-500 text-white">
          View Restaurant Details
        </Button>
        <div className="mr-5 p-3 rounded-lg flex gap-5 align-middle justify-center">
          <p className="font-bold opacity-70 text-lg">Rate Us</p>
          <Rate value={rating} onChange={(v) => updateRating(v)} />
        </div>
      </div>
      {showDetails && (
        <Collapse defaultActiveKey={['1']}>
          <Panel header="Restaurant Details" key="1">
            <div>
              <div>Contact - {details?.contact}</div>
              <div>Address - {details?.address}</div>
              <div>Cuisines - 
                {details?.cusines?.map((c, i) => (
                  <div key={i}>{c}</div>
                ))}
              </div>
            </div>
          </Panel>
        </Collapse>
      )}
      <Table columns={columns} dataSource={details?.dishes} />
    </div>
  );
};

export default RestaurantDetails;
